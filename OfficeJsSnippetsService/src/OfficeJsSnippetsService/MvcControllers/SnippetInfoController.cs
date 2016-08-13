using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using OfficeJsSnippetsService.Common;
using OfficeJsSnippetsService.Service;

namespace OfficeJsSnippetsService.MvcControllers
{
    public class SnippetViewModel
    {
        public string Id { get; set; }

        public bool Exists { get; set; }

        public string Name { get; set; }

        public string DownloadZipUri { get; set; }
    }

    public class SnippetInfoController : Controller
    {
        private readonly ISnippetInfoService snippetInfoService;

        public SnippetInfoController(ISnippetInfoService snippetInfoService)
        {
            Ensure.ArgumentNotNull(snippetInfoService, nameof(snippetInfoService));
            this.snippetInfoService = snippetInfoService;
        }

        public async Task<ActionResult> Index(string snippetId)
        {
            var entity = await this.snippetInfoService.GetSnippetInfoAsync(snippetId);

            var model = new SnippetViewModel();
            model.Id = snippetId;

            if (entity != null)
            {
                model.Exists = true;
                model.Name = entity.Name;
                model.DownloadZipUri = "/api/snippets/{0}/zipped".FormatInvariant(snippetId);

                ViewBag.Title = "{0} - Office.js API Playground".FormatInvariant(entity.Name);
            }
            else
            {
                model.Exists = false;
                ViewBag.Title = "Office.js API Playground - Snippet not found";
            };

            return View(model);
        }
    }
}