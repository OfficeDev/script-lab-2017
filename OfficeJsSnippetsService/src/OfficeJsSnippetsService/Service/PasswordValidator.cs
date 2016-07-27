using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using OfficeJsSnippetsService.Common;
using OfficeJsSnippetsService.DataModel;

namespace OfficeJsSnippetsService.Service
{
    public class PasswordValidator : IPasswordValidator
    {
        private const string PasswordHeaderName = "x-ms-b64-password";

        private readonly IPasswordHelper passwordHelper;

        public PasswordValidator(IPasswordHelper passwordHelper)
        {
            Ensure.ArgumentNotNull(passwordHelper, nameof(passwordHelper));
            this.passwordHelper = passwordHelper;
        }

        public void ValidatePasswordOrThrow(HttpRequestMessage request, SnippetInfoEntity entity)
        {
            Ensure.ArgumentNotNull(request, nameof(request));
            Ensure.ArgumentNotNull(entity, nameof(entity));

            string b64password = request.GetHeaderValueOrNull(PasswordHeaderName);
            if (string.IsNullOrEmpty(b64password))
            {
                throw new MyWebException(HttpStatusCode.BadRequest, "Header '{0}' must be specified to access protected content.".FormatInvariant(PasswordHeaderName));
            }

            string password;
            try
            {
                byte[] bytes = Convert.FromBase64String(b64password);
                password = Encoding.UTF8.GetString(bytes);
            }
            catch (Exception ex)
            {
                if (ex is FormatException ||
                    ex is ArgumentException ||
                    ex is DecoderFallbackException)
                {
                    throw new MyWebException(HttpStatusCode.BadRequest, "Invalid value specified for header '{0}'.".FormatInvariant(PasswordHeaderName), ex);
                }

                throw;
            }

            if (!this.passwordHelper.VerifyPassword(password, entity.Salt, entity.Hash))
            {
                throw new MyWebException(HttpStatusCode.BadRequest, "Wrong password.");
            }
        }
    }
}
