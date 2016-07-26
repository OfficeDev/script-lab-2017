using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;

namespace OfficeJsApiPlayground.Common
{
    internal static class Ensure
    {
        public static void ArgumentNotNull<T>(T value, string argumentName)
            where T : class
        {
            if (value == null)
            {
                throw new ArgumentException("Argument not specified", argumentName);
            }
        }

        public static void ArgumentNotNullOrEmpty(string value, string argumentName)
        {
            if (string.IsNullOrEmpty(value))
            {
                throw new ArgumentException("Argument not specified", argumentName);
            }
        }
    }
}