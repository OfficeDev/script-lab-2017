using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;

namespace OfficeJsApiPlayground.Common
{
    public class MyWebException : Exception
    {
        public HttpStatusCode StatusCode { get; private set; }

        public MyWebException(HttpStatusCode statusCode, string message)
            : base(message)
        {
            this.StatusCode = statusCode;
        }

        public override string ToString()
        {
            return "{0}. StatusCode: {1}. Details: {2}".FormatInvariant(
                typeof(MyWebException).FullName,
                this.StatusCode,
                base.ToString());
        }
    }
}