using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using OfficeJsSnippetsService.Common;

namespace OfficeJsSnippetsService.Service
{
    public class PasswordHelper : IPasswordHelper
    {
        private readonly RandomNumberGenerator rng = RandomNumberGenerator.Create();
        private readonly SHA256 sha256hash = SHA256.Create();

        public void CreateSaltAndHash(string password, out string salt, out string hash)
        {
            Ensure.ArgumentNotNullOrEmpty(password, nameof(password));

            // 256 bits of salt -- at least as big as the hash
            var saltBytes = new byte[32];
            rng.GetBytes(saltBytes);
            salt = Convert.ToBase64String(saltBytes);
            hash = ComputeHash(password, saltBytes);
        }

        public bool VerifyPassword(string password, string salt, string hash)
        {
            Ensure.ArgumentNotNullOrEmpty(password, nameof(password));
            Ensure.ArgumentNotNullOrEmpty(salt, nameof(salt));
            Ensure.ArgumentNotNullOrEmpty(hash, nameof(hash));

            try
            {
                var saltBytes = Convert.FromBase64String(salt);
                string expectedHash = ComputeHash(password, saltBytes);
                return expectedHash == hash;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        public string CreatePassword()
        {
            var bytes = new byte[32];
            this.rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }

        private string ComputeHash(string password, byte[] salt)
        {
            var passwordBytes = Encoding.UTF8.GetBytes(password);
            var bytesToHash = new byte[salt.Length + passwordBytes.Length];
            Array.Copy(salt, 0, bytesToHash, 0, salt.Length);
            Array.Copy(passwordBytes, 0, bytesToHash, salt.Length, passwordBytes.Length);

            var hashBytes = this.sha256hash.ComputeHash(bytesToHash);
            return Convert.ToBase64String(hashBytes);
        }
    }
}