using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using OfficeJsSnippetsService.Utils;

namespace OfficeJsSnippetsService.Service
{
    public class IdGenerator
    {
        private const string Alphabet = "abcdefghjkmnpqrstuvwxyz123456789";

        public string GenerateId()
        {
            byte[] bytes = Guid.NewGuid().ToByteArray();
            ulong hash = Fnv1a64.Hash(bytes, 0, bytes.Length);
            return CreateCustomBase32String(hash);
        }

        private string CreateCustomBase32String(ulong value)
        {
            var result = new char[13];
            for (int i = 0; i < result.Length; i++)
            {
                int val5bits = (int)(value >> (64 - 5));
                result[i] = Alphabet[val5bits];
                value <<= 5;
            }

            return new string(result);
        }
    }
}