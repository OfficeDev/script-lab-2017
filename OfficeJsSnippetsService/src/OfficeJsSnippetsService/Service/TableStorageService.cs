using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;
using OfficeJsSnippetsService.Common;

namespace OfficeJsSnippetsService.Service
{
    public class TableStorageService : ITableStorageService
    {
        private readonly ServiceConfig config;
        private readonly Logger logger;
        private readonly CloudTableClient tableClient;

        public TableStorageService(Logger logger, ServiceConfigProvider configProvider)
        {
            Ensure.ArgumentNotNull(logger, nameof(logger));
            Ensure.ArgumentNotNull(configProvider, nameof(configProvider));

            this.logger = logger;
            this.config = configProvider.GetConfig();

            CloudStorageAccount account = CloudStorageAccount.Parse(this.config.TableConnectionString);
            this.tableClient = account.CreateCloudTableClient();
        }

        public async Task<IList<T>> QueryAsync<T>(string tableName, string filter = null, int? take = null)
            where T : ITableEntity, new()
        {
            return await this.RunAndCreateTableIfNotExistsAsync(
                tableName,
                async (CloudTable table) =>
                {
                    var results = new List<T>();

                    var query = new TableQuery<T>();
                    if (!string.IsNullOrEmpty(filter))
                    {
                        query = query.Where(filter);
                    }
                    if (take.HasValue)
                    {
                        query = query.Take(take);
                    }

                    TableContinuationToken token = null;
                    do
                    {
                        var segment = await table.ExecuteQuerySegmentedAsync(query, token);
                        results.AddRange(segment.Results);
                        token = segment.ContinuationToken;
                    }
                    while (token != null);

                    return results;
                });
        }

        public async Task InsertAsync<T>(string tableName, T item)
            where T : ITableEntity, new()
        {
            await this.RunAndCreateTableIfNotExistsAsync(
                tableName,
                async (CloudTable table) =>
                {
                    TableResult result = await table.ExecuteAsync(TableOperation.Insert(item));
                    return result;
                });
        }

        public async Task UpdateAsync<T>(string tableName, T item)
            where T : ITableEntity, new()
        {
            CloudTable table = this.tableClient.GetTableReference(tableName);
            await table.ExecuteAsync(TableOperation.Replace(item));
        }

        private async Task<T> RunAndCreateTableIfNotExistsAsync<T>(string tableName, Func<CloudTable, Task<T>> lambda)
        {
            CloudTable table = this.tableClient.GetTableReference(tableName);

            try
            {
                return await lambda(table);
            }
            catch (StorageException storageException)
            {
                if (storageException.RequestInformation?.HttpStatusCode == (int)HttpStatusCode.NotFound)
                {
                    // Table not found, so we fall through and try again
                    // after creating the table...
                    this.logger.Info("Table '{0}' does not exist on account '{1}'. Will try to create it.".FormatInvariant(tableName, this.tableClient.BaseUri));
                }
                else
                {
                    throw;
                }
            }

            try
            {
                await table.CreateAsync();
            }
            catch (StorageException ex)
            {
                this.logger.Info("Failed to create table '{0}' on account '{1}': {2}".FormatInvariant(tableName, this.tableClient.BaseUri, ex.Message));
            }

            return await lambda(table);
        }
    }
}