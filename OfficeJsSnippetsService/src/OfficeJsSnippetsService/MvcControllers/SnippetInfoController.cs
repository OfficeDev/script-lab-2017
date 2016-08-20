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
    public struct SnippetMetadata
    {
        public string Id { get; set; }
        public string Name { get; set; }

        public string[] Hosts { get; set; }

        public bool IsOfficeJs
        {
            get
            {
                return Hosts.Contains("word") || Hosts.Contains("excel");
            }
        }
    }

    public class SnippetViewModel
    {
        public bool Exists { get; set; }

        public string DownloadZipUri { get; set; }

        public SnippetMetadata Metadata { get; set; }

        public string IFrameUrl
        {
            get
            {
                return System.Configuration.ConfigurationManager.AppSettings["PlaygroundBaseUrl"] +
                    "#/view/@Model.Id";
            }
        }

        public string[] Message { get; set; }
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

            if (entity != null)
            {
                model.Exists = true;
                var metadata = new SnippetMetadata();
                metadata.Id = entity.SnippetId;
                metadata.Name = entity.Name;
                metadata.Hosts = entity.HostsArray;
                model.Metadata = metadata;
                model.DownloadZipUri = "/api/snippets/{0}/zipped".FormatInvariant(snippetId);

                var title = metadata.IsOfficeJs ? "Office.js API Playground" : "TypeScript API Playground";

                ViewBag.SnippetTitle = "Snippet" +
                    (String.IsNullOrWhiteSpace(entity.Name) ? "" : "\"" + entity.Name + "\"");
                ViewBag.Title =
                    (String.IsNullOrWhiteSpace(entity.Name) ? "" : entity.Name + " - ") + title;

                if (metadata.IsOfficeJs)
                {
                    model.Message = new string[] {
                        "You are looking at a snippet that was shared with you.",
                        "To see the snippet in action, download the API Playground Add-in from the Office store.",
                        "You can also view the snippet code on the pane to the right."
                    };
                }
                else
                {
                    model.Message = new string[] {
                        "You are looking at a snippet that was shared with you.",
                        "You can view the snippet code on the pane to the right.",
                        "To import and run it yourself, launch the TypeScript Playground at",
                        System.Configuration.ConfigurationManager.AppSettings["PlaygroundBaseUrl"] + "#/web",
                        "and choose the \"Create from link\" button on the bottom of the page.",
                        "Or, use the playground to create a snippet of your own!"
                    };
                }
            }
            else
            {
                model.Exists = false;
                ViewBag.Title = "API Playground - Snippet not found";
            };

            return View(model);
        }
    }
}