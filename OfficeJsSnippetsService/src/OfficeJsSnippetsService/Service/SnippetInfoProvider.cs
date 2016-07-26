using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using OfficeJsApiPlayground.Common;
using OfficeJsApiPlayground.DataModel;

namespace OfficeJsApiPlayground.Service
{
    public class SnippetInfoProvider
    {
        private const string TableName = "snippets";
        private const string ContainerNameTemplate = "snippet{0}";

        private readonly ITableStorageService tableService;

        public SnippetInfoProvider(ITableStorageService tableService)
        {
            Ensure.ArgumentNotNull(tableService, nameof(tableService));
            this.tableService = tableService;
        }

        public async Task<SnippetInfoEntity> GetSnippetInfoAsync(string snippetId)
        {
            string filter = SnippetInfoEntity.GenerateLookupFilter(snippetId);
            var entities = await this.tableService.QueryAsync<SnippetInfoEntity>(
                TableName,
                filter);

            return entities.FirstOrDefault();
        }
    }
}