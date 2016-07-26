using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
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
        private static readonly Dictionary<string, string> knownMimeTypes = new Dictionary<string, string>
        {
            { "html", "text/html" },
            { "js", "application/x-javascript" },
            { "css", "text/css" },
        };

        private const string SnippetIdValidationPattern = "^[0-9a-z]{3,}$";

        private static readonly Regex snippetIdValidationRegex = new Regex(SnippetIdValidationPattern);

        private readonly SnippetInfoService snippetInfoService;
        private readonly SnippetContentService snippetContentService;
        private readonly IdGenerator idGenerator;
        private readonly PasswordHelper passwordHelper;

        public SnippetsController(SnippetInfoService snippetInfoService, SnippetContentService snippetContentService, IdGenerator idGenerator, PasswordHelper passwordHelper)
        {
            Ensure.ArgumentNotNull(snippetInfoService, nameof(snippetInfoService));
            Ensure.ArgumentNotNull(snippetContentService, nameof(snippetContentService));
            Ensure.ArgumentNotNull(idGenerator, nameof(idGenerator));
            Ensure.ArgumentNotNull(passwordHelper, nameof(passwordHelper));

            this.snippetInfoService = snippetInfoService;
            this.snippetContentService = snippetContentService;
            this.idGenerator = idGenerator;
            this.passwordHelper = passwordHelper;
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
            // TODO: Update last accessed date

            return ToSnippetInfoDto(entity);
        }

        [HttpPost, Route("~/api/snippets")]
        public async Task<SnippetInfoDto> CreateSnippet([FromBody] SnippetInfoWithKeyDto snippetInfo)
        {
            var entity = SnippetInfoEntity.Create(this.idGenerator.GenerateId());
            entity.CreatorIP = HttpContext.Current?.Request?.UserHostAddress;
            entity.LastAccessed = DateTimeOffset.UtcNow;

            if (snippetInfo != null)
            {
                entity.Name = snippetInfo.Name;
                if (!string.IsNullOrEmpty(snippetInfo.Key))
                {
                    string salt, hash;
                    this.passwordHelper.CreateSaltAndHash(snippetInfo.Key, out salt, out hash);
                    entity.Salt = salt;
                    entity.Hash = hash;
                };
            };

            await this.snippetInfoService.CreateSnippetAsync(entity);
            return ToSnippetInfoDto(entity);
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
    }
}
