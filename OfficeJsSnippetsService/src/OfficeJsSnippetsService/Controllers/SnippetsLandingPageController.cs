using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using OfficeJsSnippetsService.Common;
using OfficeJsSnippetsService.DataModel;
using OfficeJsSnippetsService.Service;

namespace OfficeJsSnippetsService.Controllers
{
    public class SnippetsLandingPageController : ApiController
    {
        private readonly ISnippetInfoService snippetInfoService;
        private readonly ISnippetContentService snippetContentService;

        public SnippetsLandingPageController(ISnippetInfoService snippetInfoService, ISnippetContentService snippetContentService)
        {
            Ensure.ArgumentNotNull(snippetInfoService, nameof(snippetInfoService));
            Ensure.ArgumentNotNull(snippetContentService, nameof(snippetContentService));

            this.snippetInfoService = snippetInfoService;
            this.snippetContentService = snippetContentService;
        }

        [HttpGet, Route("~/snippets/{snippetId}")]
        public async Task<HttpResponseMessage> Get(string snippetId)
        {
            SnippetInfoEntity entity = await this.snippetInfoService.GetSnippetInfoAsync(snippetId);
            if (entity == null)
            {
                return this.CreateHtmlResponse("<html><body><h2>This snippet doesn't exist yet</h2></body></html>");
            }

            const string Template = @"<html><body><h2>{0} - an OfficeJS Playground snippet</h2>" +
                @"<p>id: {1}</p>" +
                @"<ul>" +
                @"<li><a href=""{2}"">Html</a></li>" +
                @"<li><a href=""{3}"">Css</a></li>" +
                @"<li><a href=""{4}"">JavaScript</a></li>" +
                @"<li><a href=""{5}"">Extras</a></li>" +
                @"</ul>" +
                @"<p><a href=""{6}"">Download all as a zip file</a></p>" +
                @"<p>Use the following link to import in the OfficeJS Playground AddIn:<br/>" +
                @"<a href=""{7}"">{7}</a></p>" +
                "</body></html>";
            string html = Template.FormatInvariant(
                string.IsNullOrEmpty(entity.Name) ? "Unnamed" : WebUtility.HtmlEncode(entity.Name),
                WebUtility.HtmlEncode(snippetId),
                GetContentUri(snippetId, "html"),
                GetContentUri(snippetId, "css"),
                GetContentUri(snippetId, "js"),
                GetContentUri(snippetId, "extras"),
                GetZippedUri(snippetId),
                GetAddInUri(snippetId));
            return this.CreateHtmlResponse(html);
        }

        private object GetAddInUri(string snippetId)
        {
            string baseUrl = HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority);
            var uri = new Uri(new Uri(baseUrl), "/api/snippets/{0}".FormatInvariant(snippetId));
            return uri.ToString();
        }

        private object GetZippedUri(string snippetId)
        {
            return "/api/snippets/{0}/zipped".FormatInvariant(snippetId);
        }

        private static string GetContentUri(string snippetId, string fileName)
        {
            return "/api/snippets/{0}/content/{1}".FormatInvariant(snippetId, fileName);
        }

        public HttpResponseMessage CreateHtmlResponse(string body)
        {
            var response = this.Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new StringContent(body, Encoding.UTF8, "text/html");
            return response;
        }
    }
}
