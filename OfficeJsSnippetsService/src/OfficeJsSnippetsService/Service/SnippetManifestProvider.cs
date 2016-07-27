using System;

namespace OfficeJsSnippetsService.Service
{
    public class SnippetManifestProvider
    {
        const string ManifestTemplate = @"<?xml version=""1.0"" encoding=""UTF-8""?>
<OfficeApp xmlns=""http://schemas.microsoft.com/office/appforoffice/1.1"" xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xsi:type=""TaskPaneApp"">
  <Id>___GUID___</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>Created with Office.js API Playground</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue=""Snippet from Office.js API Playground"" />
  <Description DefaultValue=""Snippet from Office.js API Playground"" />
  <Hosts>
    <Host Name=""___HOST___"" />
  </Hosts>
  <DefaultSettings>
    <!-- Change this location to the URL where your add-in is hosted (i.e., localhost) -->
    <SourceLocation DefaultValue=""https://localhost:3000/index.html"" />
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>";

        public string GenerateManifest(string snippetId)
        {
            string manifest = ManifestTemplate
                .Replace("___GUID___", Guid.NewGuid().ToString())
                .Replace("___HOST___", "Workbook");

            return manifest;
        }
    }
}