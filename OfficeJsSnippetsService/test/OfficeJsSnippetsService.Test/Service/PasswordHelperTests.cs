using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using OfficeJsSnippetsService.Service;
using Xunit;

namespace OfficeJsSnippetsService.Test.Service
{
    public class PasswordHelperTests
    {
        PasswordHelper passwordHelper = new PasswordHelper();

        [Fact]
        public void Hashing_Works()
        {
            const int N = 20;

            // Arrange
            var passwords = Enumerable.Range(0, N).Select(i => Guid.NewGuid().ToString()).ToArray();
            var salts = new string[N];
            var hashes = new string[N];

            var seenSalts = new HashSet<string>();
            var seenHashes = new HashSet<string>();

            // Act & Assert
            for (int i = 0; i < N; i++)
            {
                // Create salts and hashes
                passwordHelper.CreateSaltAndHash(passwords[i], out salts[i], out hashes[i]);
                Assert.Equal(44, salts[i].Length);
                Assert.Equal(44, hashes[i].Length);

                Assert.False(seenSalts.Contains(salts[i]));
                Assert.False(seenHashes.Contains(hashes[i]));

                seenSalts.Add(salts[i]);
                seenHashes.Add(hashes[i]);
            }

            for (int i = 0; i < N; i++)
            {
                for (int j = 0; j < N; j++)
                {
                    // Validate each password against all salts and hashes.
                    // Should only match for i == j
                    bool expectedOutcome = i == j;
                    Assert.Equal(expectedOutcome, passwordHelper.VerifyPassword(passwords[i], salts[j], hashes[j]));
                }
            }
        }

        [Fact]
        public void CreatePassword_Works()
        {
            // Arrange
            var seenPasswords = new HashSet<string>();

            // Act & Assert
            for (int i = 0; i < 100; i++)
            {
                string password = this.passwordHelper.CreatePassword();
                Assert.Equal(44, password.Length);
                Assert.False(seenPasswords.Contains(password));
                seenPasswords.Add(password);
            }
        }
    }
}
