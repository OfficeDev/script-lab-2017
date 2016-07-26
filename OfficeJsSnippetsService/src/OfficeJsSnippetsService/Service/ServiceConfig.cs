using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace OfficeJsSnippetsService.Service
{
    public class ServiceConfig
    {
        public string BlobConnectionString
        {
            get { return GetConnectionStringOrNull(Constants.BlobConnectionStringKey); }
        }

        public string TableConnectionString
        {
            get { return GetConnectionStringOrNull(Constants.TableConnectionStringKey); }
        }

        public string DeploymentTag
        {
            get { return GetSettingOrDefault(Constants.DeploymentTagKey); }
        }

        public string GetSettingOrDefault(string key, string defaultValue = null)
        {
            return ConfigurationManager.AppSettings[key] ?? defaultValue;
        }

        public string GetConnectionStringOrNull(string name)
        {
            ConnectionStringSettings connectionString = ConfigurationManager.ConnectionStrings[name];
            return connectionString?.ConnectionString;
        }
    }
}