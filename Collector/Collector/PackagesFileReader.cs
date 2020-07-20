using Collector.Models;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;

namespace Collector
{
    public class PackagesFileReader : IFileReader
    {
        private readonly string packageFilePath;

        public PackagesFileReader(string packageFilePath)
        {
            this.packageFilePath = packageFilePath;
        }

        public ICollection<Package> ReadDependencies()
        {
            if (!File.Exists(packageFilePath))
                return new Package[0];

            var packageXml = XDocument.Load(packageFilePath);
            var packages = packageXml.Root.DescendantNodes().OfType<XElement>().Select(ParseElement).ToArray();
            return packages;
        }

        private Package ParseElement(XElement element)
        {
            return new Package(element.Attribute("id").Value, element.Attribute("version").Value, "nuget");
        }
    }
}
