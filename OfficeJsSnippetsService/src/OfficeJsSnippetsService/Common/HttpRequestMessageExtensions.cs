using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web;

namespace OfficeJsSnippetsService.Common
{
    public static class HttpRequestMessageExtensions
    {
        public static string GetHeaderValueOrNull(this HttpRequestMessage request, string name)
        {
            Ensure.ArgumentNotNull(request, nameof(request));

            if (request.Headers != null)
            {
                IEnumerable<string> values;
                request.Headers.TryGetValues(name, out values);
                if (values != null)
                {
                    return values.FirstOrDefault();
                }
            }

            return null;
        }
    }
}