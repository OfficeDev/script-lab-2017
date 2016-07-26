using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using OfficeJsSnippetsService.Common;
using OfficeJsSnippetsService.Service;

namespace OfficeJsSnippetsService.Controllers
{
    public class HealthController : ApiController
    {
        private readonly ServiceConfig config;

        public HealthController(ServiceConfigProvider configProvider)
        {
            Ensure.ArgumentNotNull(configProvider, nameof(configProvider));
            this.config = configProvider.GetConfig();
        }

        [HttpGet]
        public JObject GetHealth()
        {
            return new JObject
            {
                { "time", DateTimeOffset.Now },
                { "deploymentTag", this.config.DeploymentTag }
            };
        }
    }
}
