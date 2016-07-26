using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.WindowsAzure.Storage.Table;
using OfficeJsApiPlayground.Common;

namespace OfficeJsApiPlayground.DataModel
{
    public class SnippetInfoEntity : TableEntity
    {
        public string SnippetId
        {
            get { return this.PartitionKey; }
        }

        public string Name { get; set; }

        public DateTimeOffset LastAccessed { get; set; }

        public static string GenerateLookupFilter(string snippetId)
        {
            Ensure.ArgumentNotNullOrEmpty(snippetId, nameof(snippetId));

            string partitionKeyFilter = TableQuery.GenerateFilterCondition(
                "PartitionKey",
                QueryComparisons.Equal,
                GeneratePartitionKey(snippetId));

            string rowKeyFilter = TableQuery.GenerateFilterCondition(
                "RowKey",
                QueryComparisons.Equal,
                GenerateRowKey());

            return TableQuery.CombineFilters(
                partitionKeyFilter,
                TableOperators.And,
                rowKeyFilter);
        }

        public static SnippetInfoEntity Create(string snippetId)
        {
            return new SnippetInfoEntity
            {
                PartitionKey = GeneratePartitionKey(snippetId),
                RowKey = GenerateRowKey()
            };
        }

        private static string GeneratePartitionKey(string snippetId)
        {
            return snippetId;
        }

        private static string GenerateRowKey()
        {
            return "1";
        }
    }
}
