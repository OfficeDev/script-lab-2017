using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;

namespace OfficeJsApiPlayground.Common
{
    internal static class UserValidation
    {
        public static void ArgumentNotNullOrEmpty(string value, string argumentName)
        {
            if (string.IsNullOrEmpty(value))
            {
                throw new MyWebException(HttpStatusCode.BadRequest, "{0} must be specified.".FormatInvariant(argumentName));
            }
        }
    }
}