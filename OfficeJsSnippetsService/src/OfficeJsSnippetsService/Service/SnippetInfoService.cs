using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using OfficeJsSnippetsService.Common;
using OfficeJsSnippetsService.DataModel;

namespace OfficeJsSnippetsService.Service
{
    public class SnippetInfoService : ISnippetInfoService
    {
        private const string TableName = "snippets";
        private const string ContainerNameTemplate = "snippet{0}";

        private readonly ITableStorageService tableService;

        public SnippetInfoService(ITableStorageService tableService)
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

        public async Task CreateSnippetAsync(SnippetInfoEntity entity)
        {
            Ensure.ArgumentNotNull(entity, nameof(entity));
            Ensure.ArgumentNotNullOrEmpty(entity.PartitionKey, "{0}.{1}".FormatInvariant(nameof(entity), nameof(entity.PartitionKey)));
            Ensure.ArgumentNotNullOrEmpty(entity.RowKey, "{0}.{1}".FormatInvariant(nameof(entity), nameof(entity.RowKey)));

            await this.tableService.InsertAsync(TableName, entity);
        }

        public async Task SetSnippetInfoAsync(SnippetInfoEntity entity)
        {
            Ensure.ArgumentNotNull(entity, nameof(entity));

            await this.tableService.UpdateAsync(TableName, entity);
        }
    }
}