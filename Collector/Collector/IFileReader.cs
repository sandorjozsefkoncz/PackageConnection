using Collector.Models;
using System.Collections.Generic;

namespace Collector
{
    public interface IFileReader
    {
        ICollection<Package> ReadDependencies();
    }
}