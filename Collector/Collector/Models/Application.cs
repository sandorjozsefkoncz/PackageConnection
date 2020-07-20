using System.Collections.Generic;

namespace Collector.Models
{
    public class Application
    {
        public string ApplicationName { get; set; }

        public ICollection<Package> Packages { get; set; }

        public Application(string applicationName, ICollection<Package> packages)
        {
            ApplicationName = applicationName;
            Packages = packages;
        }

        public string GetId()
        {
            return ApplicationName;
        }
    }
}
