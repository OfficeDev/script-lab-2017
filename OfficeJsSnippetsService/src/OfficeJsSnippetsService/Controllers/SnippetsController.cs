using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
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

        private readonly SnippetInfoProvider infoProvider;
        private readonly SnippetContentProvider contentProvider;

        private static readonly Regex snippetIdValidationRegex = new Regex(SnippetIdValidationPattern);

        public SnippetsController(SnippetInfoProvider infoProvider, SnippetContentProvider contentProvider)
        {
            Ensure.ArgumentNotNull(infoProvider, nameof(infoProvider));
            Ensure.ArgumentNotNull(contentProvider, nameof(contentProvider));

            this.infoProvider = infoProvider;
            this.contentProvider = contentProvider;
        }

        [HttpGet, Route("~/api/snippets/{snippetId}")]
        public async Task<SnippetInfoDto> GetSnippetInfo(string snippetId)
        {
            ValidateSnippetId(snippetId);

            SnippetInfoEntity entity = await this.infoProvider.GetSnippetInfoAsync(snippetId);
            if (entity == null)
            {
                throw new MyWebException(HttpStatusCode.NotFound, "Snippet '{0}' does not exist.".FormatInvariant(snippetId));
            }
            // TODO: Update last accessed date

            return ToSnippetInfoDto(entity);
        }

        [HttpPost, Route("~/api/snippets")]
        public async Task<SnippetInfoDto> CreateSnippet()
        {
            await Task.FromResult(0);
            return new SnippetInfoDto();
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

            string content = await this.contentProvider.GetContentAsync(snippetId, fileName);

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
