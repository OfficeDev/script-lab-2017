using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace OfficeJsSnippetsService.Utils
{
    public class Fnv1a64
    {
        private const ulong FnvPrime = 1099511628211;
        private const ulong FnvOffsetBasis = 14695981039346656037;

        private ulong hash;

        /// <summary>
        /// Creates a new instance of the <see cref="Fnv1a64"/> class.
        /// </summary>
        private Fnv1a64()
        {
            this.hash = FnvOffsetBasis;
        }

        private ulong ComputeHash(byte[] array, int startIndex, int count)
        {
            for (var i = startIndex; i < count; i++)
            {
                unchecked
                {
                    this.hash ^= array[i];
                    this.hash *= FnvPrime;
                }
            }

            return this.hash;
        }

        public static ulong Hash(byte[] array, int startIndex, int count)
        {
            Fnv1a64 fnv = new Fnv1a64();
            return fnv.ComputeHash(array, startIndex, count);
        }
    }
}