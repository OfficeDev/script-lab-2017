using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Web.Mvc;
using Autofac;
using Autofac.Integration.Mvc;
using Autofac.Integration.WebApi;
using OfficeJsSnippetsService.Filters;
using OfficeJsSnippetsService.Service;

namespace OfficeJsSnippetsService
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            var logger = new Logger();

            // Web API configuration and services
            config.Filters.Add(new MyWebExceptionFilter(logger));

            var cors = new EnableCorsAttribute("*", "*", "*");
            config.EnableCors(cors);

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            ConfigureAutofac(config, logger);
        }

        private static void ConfigureAutofac(HttpConfiguration config, Logger logger)
        {
            var builder = new ContainerBuilder();
            builder.RegisterApiControllers(typeof(WebApiConfig).Assembly);
            builder.RegisterControllers(typeof(WebApiConfig).Assembly);

            builder.RegisterInstance(logger);
            builder.RegisterType<ServiceConfigProvider>().SingleInstance();
            builder.RegisterType<BlobService>().As<IBlobService>();
            builder.RegisterType<TableStorageService>().As<ITableStorageService>();
            builder.RegisterType<SnippetInfoService>().As<ISnippetInfoService>();
            builder.RegisterType<SnippetContentService>().As<ISnippetContentService>();
            builder.RegisterType<IdGenerator>().As<IIdGenerator>();
            builder.RegisterType<PasswordHelper>().As<IPasswordHelper>();
            builder.RegisterType<PasswordValidator>().As<IPasswordValidator>();
            builder.RegisterType<SnippetZipService>().As<ISnippetZipService>();
            builder.RegisterType<SnippetManifestProvider>();

            var container = builder.Build();
            config.DependencyResolver = new AutofacWebApiDependencyResolver(container);
            DependencyResolver.SetResolver(new AutofacDependencyResolver(container));
        }
    }
}
