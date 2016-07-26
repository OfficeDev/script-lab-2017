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
    public class IdGeneratorTests
    {
        IdGenerator idGenerator = new IdGenerator();

        [Fact]
        public void GenerateId_RespectsPatternAndDoesNotRepeat()
        {
            // Arrange
            var seenIds = new HashSet<string>();

            // Act & Assert
            for (int i = 0; i < 100; i++)
            {
                string id = this.idGenerator.GenerateId();
                Assert.True(Regex.IsMatch(id, "^[0-9a-z]{13}$"));
                Assert.False(seenIds.Contains(id));
                seenIds.Add(id);
            }
        }
    }
}
