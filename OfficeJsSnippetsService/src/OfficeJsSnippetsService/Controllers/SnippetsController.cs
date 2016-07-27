using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using OfficeJsSnippetsService.Common;
using OfficeJsSnippetsService.DataModel;
using OfficeJsSnippetsService.Service;

namespace OfficeJsSnippetsService.Controllers
{
    public class SnippetsController : ApiController
    {
        private const string PasswordHeaderName = "x-ms-b64-password";
        private const long MaxContentLength = 10 * 1024 * 1024;

        private static readonly Dictionary<string, string> knownMimeTypes = new Dictionary<string, string>
        {
            { "html", "text/html" },
            { "js", "application/x-javascript" },
            { "css", "text/css" },
            { "extras", "text/plain" }
        };

        private const string SnippetIdValidationPattern = "^[0-9a-z]{3,}$";

        private static readonly Regex snippetIdValidationRegex = new Regex(SnippetIdValidationPattern);

        private readonly ISnippetInfoService snippetInfoService;
        private readonly ISnippetContentService snippetContentService;
        private readonly IIdGenerator idGenerator;
        private readonly IPasswordHelper passwordHelper;
        private readonly IPasswordValidator passwordValidator;

        public SnippetsController(
            ISnippetInfoService snippetInfoService,
            ISnippetContentService snippetContentService,
            IIdGenerator idGenerator,
            IPasswordHelper passwordHelper,
            IPasswordValidator passwordValidator)
        {
            Ensure.ArgumentNotNull(snippetInfoService, nameof(snippetInfoService));
            Ensure.ArgumentNotNull(snippetContentService, nameof(snippetContentService));
            Ensure.ArgumentNotNull(idGenerator, nameof(idGenerator));
            Ensure.ArgumentNotNull(passwordHelper, nameof(passwordHelper));
            Ensure.ArgumentNotNull(passwordValidator, nameof(passwordValidator));

            this.snippetInfoService = snippetInfoService;
            this.snippetContentService = snippetContentService;
            this.idGenerator = idGenerator;
            this.passwordHelper = passwordHelper;
            this.passwordValidator = passwordValidator;
        }

        [HttpGet, Route("~/api/snippets/{snippetId}")]
        public async Task<SnippetInfoDto> GetSnippetInfo(string snippetId)
        {
            ValidateSnippetId(snippetId);

            SnippetInfoEntity entity = await this.snippetInfoService.GetSnippetInfoAsync(snippetId);
            if (entity == null)
            {
                throw new MyWebException(HttpStatusCode.NotFound, "Snippet '{0}' does not exist.".FormatInvariant(snippetId));
            }

            return ToSnippetInfoDto(entity);
        }

        [HttpPut, Route("~/api/snippets/{snippetId}")]
        public async Task<SnippetInfoDto> SetSnippetInfo(string snippetId, [FromBody] SnippetInfoDto snippetInfo)
        {
            ValidateSnippetId(snippetId);

            if (snippetInfo == null)
            {
                throw new MyWebException(HttpStatusCode.BadRequest, "Body must be provided");
            }

            SnippetInfoEntity entity = await this.snippetInfoService.GetSnippetInfoAsync(snippetId);
            if (entity == null)
            {
                throw new MyWebException(HttpStatusCode.NotFound, "Snippet '{0}' does not exist.".FormatInvariant(snippetId));
            }

            this.passwordValidator.ValidatePasswordOrThrow(this.Request, entity);

            entity.Name = snippetInfo.Name;
            await this.snippetInfoService.SetSnippetInfoAsync(entity);

            return ToSnippetInfoDto(entity);
        }

        [HttpPost, Route("~/api/snippets")]
        public async Task<SnippetInfoWithPasswordDto> CreateSnippet([FromBody] SnippetInfoWithPasswordDto snippetInfo)
        {
            var entity = SnippetInfoEntity.Create(this.idGenerator.GenerateId());
            entity.CreatorIP = HttpContext.Current?.Request?.UserHostAddress;

            string password = null;
            if (snippetInfo != null)
            {
                entity.Name = snippetInfo.Name;
                password = snippetInfo.Password;
            };

            if (string.IsNullOrEmpty(password))
            {
                password = this.passwordHelper.CreatePassword();
            }
            string salt, hash;
            this.passwordHelper.CreateSaltAndHash(password, out salt, out hash);
            entity.Salt = salt;
            entity.Hash = hash;

            await this.snippetInfoService.CreateSnippetAsync(entity);
            await this.snippetContentService.CreateContainerAsync(entity.SnippetId);

            return ToSnippetInfoWithPasswordDto(entity, password);
        }

        [HttpGet, Route("~/api/snippets/{snippetId}/content/{fileName}")]
        public async Task<HttpResponseMessage> GetSnippetContent(string snippetId, string fileName)
        {
            ValidateSnippetId(snippetId);

            string mimeType;
            if (!knownMimeTypes.TryGetValue(fileName, out mimeType))
            {
                string message = "Invalid fileName '{0}'. Expected {1}.".FormatInvariant(
                    fileName,
                    string.Join(", ", knownMimeTypes.Keys.Select(k => "'{0}'".FormatInvariant(k))));
                throw new MyWebException(HttpStatusCode.BadRequest, message);
            }

            string content = await this.snippetContentService.GetContentAsync(snippetId, fileName);

            var response = new HttpResponseMessage(HttpStatusCode.OK);
            response.Content = new StringContent(content, Encoding.UTF8, mimeType);
            return response;
        }

        [HttpPut, Route("~/api/snippets/{snippetId}/content/{fileName}")]
        public async Task SetSnippetContent(string snippetId, string fileName)
        {
            ValidateSnippetId(snippetId);

            string mimeType;
            if (!knownMimeTypes.TryGetValue(fileName, out mimeType))
            {
                string message = "Invalid fileName '{0}'. Expected {1}.".FormatInvariant(
                    fileName,
                    string.Join(", ", knownMimeTypes.Keys.Select(k => "'{0}'".FormatInvariant(k))));
                throw new MyWebException(HttpStatusCode.BadRequest, message);
            }

            SnippetInfoEntity entity = await this.snippetInfoService.GetSnippetInfoAsync(snippetId);
            if (entity == null)
            {
                throw new MyWebException(HttpStatusCode.NotFound, "Snippet '{0}' does not exist.".FormatInvariant(snippetId));
            }

            this.passwordValidator.ValidatePasswordOrThrow(this.Request, entity);

            long contentLength = this.Request.Content?.Headers?.ContentLength ?? 0;
            if (contentLength == 0)
            {
                await this.snippetContentService.DeleteContentIfExistsAsync(snippetId, fileName);
            }
            else if (contentLength < MaxContentLength)
            {
                string body = await this.Request.Content.ReadAsStringAsync();
                await this.snippetContentService.SetContentAsync(snippetId, fileName, body);
            }
            else
            {
                throw new MyWebException(HttpStatusCode.BadRequest, "Maximum allowable content length is {0} bytes.".FormatInvariant(MaxContentLength));
            }
        }

        [HttpGet, Route("~/api/snippets/{snippetId}/zipped")]
        public async Task<HttpResponseMessage> GetZippedSnippet(string snippetId)
        {
            ValidateSnippetId(snippetId);

            string[] fileNames = knownMimeTypes.Keys.ToArray();
            var tasks = new Task<string>[fileNames.Length];
            for (int i = 0; i < fileNames.Length; i++)
            {
                tasks[i] = this.GetFileContentOrNull(snippetId, fileNames[i]);
            }
            string[] contents = await Task.WhenAll(tasks);

            var ms = new MemoryStream();
            using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
            {
                for (int i = 0; i < fileNames.Length; i++)
                {
                    var entry = zip.CreateEntry("default.{0}".FormatInvariant(fileNames[i]));
                    using (StreamWriter writer = new StreamWriter(entry.Open()))
                    {
                        writer.Write(contents[i]);
                    }
                }
            }
            ms.Seek(0, SeekOrigin.Begin);

            var response = this.Request.CreateResponse();
            var content = new StreamContent(ms);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/zip");
            content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
            {
                FileName = "officejs_snippet_{0}.zip".FormatInvariant(snippetId)
            };
            response.Content = content;
            return response;
        }

        private async Task<string> GetFileContentOrNull(string snippetId, string fileName)
        {
            try
            {
                return await this.snippetContentService.GetContentAsync(snippetId, fileName);
            }
            catch (MyWebException)
            {
                return null;
            }
        }

        private static void ValidateSnippetId(string snippetId)
        {
            UserValidation.ArgumentNotNullOrEmpty(snippetId, nameof(snippetId));
            if (!snippetIdValidationRegex.IsMatch(snippetId))
            {
                throw new MyWebException(HttpStatusCode.BadRequest, "Invalid snippetId. It must conform to the pattern '{0}'.".FormatInvariant(SnippetIdValidationPattern));
            }
        }

        private static SnippetInfoDto ToSnippetInfoDto(SnippetInfoEntity entity)
        {
            return new SnippetInfoDto
            {
                Id = entity.SnippetId,
                Name = entity.Name
            };
        }

        private static SnippetInfoWithPasswordDto ToSnippetInfoWithPasswordDto(SnippetInfoEntity entity, string password)
        {
            return new SnippetInfoWithPasswordDto
            {
                Id = entity.SnippetId,
                Name = entity.Name,
                Password = password
            };
        }
    }
}
