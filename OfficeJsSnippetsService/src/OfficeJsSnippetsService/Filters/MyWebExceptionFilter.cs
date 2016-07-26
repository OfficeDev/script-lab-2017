using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Http.Filters;
using OfficeJsApiPlayground.Common;
using OfficeJsApiPlayground.Service;

namespace OfficeJsApiPlayground.Filters
{
    public class MyWebExceptionFilter : ExceptionFilterAttribute
    {
        private readonly Logger logger;

        public MyWebExceptionFilter(Logger logger)
        {
            Ensure.ArgumentNotNull(logger, nameof(logger));
            this.logger = logger;
        }

        public override void OnException(HttpActionExecutedContext context)
        {
            var exception = context?.Exception;
            var customException = exception as MyWebException;

            if (customException != null)
            {
                var response = new HttpResponseMessage(customException.StatusCode);
                response.Content = new StringContent(customException.Message);
                context.Response = response;

                this.logger.Info("[Custom exception] " + customException.ToString());
            }
            else if (exception != null)
            {
                this.logger.Error("[Unhandled exception] " + exception.ToString());
            }
        }
    }
}