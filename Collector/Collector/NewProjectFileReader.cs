using Collector.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Xml.Linq;

namespace Collector
{
    public class NewProjectFileReader : IFileReader
    {
        private readonly string projectFilePath;

        public NewProjectFileReader(string projectFilePath)
        {
            this.projectFilePath = projectFilePath;
        }

        public ICollection<Package> ReadDependencies()
        {
            if (!File.Exists(projectFilePath))
                return new Package[0];

            XDocument projDefinition = XDocument.Load(projectFilePath);
            var packages = new List<Package>();
           // packages.AddRange(GetProjectReferences(projDefinition));
            packages.AddRange(GetPackageReferences(projDefinition));

            return packages;
        }

        private static List<Package> GetProjectReferences(XDocument projDefinition)
        {
            var packages = new List<Package>();

            var refElements = projDefinition.Element("Project")?.Elements("ItemGroup")?.Elements("ProjectReference") ?? new List<XElement>();

            foreach (var reference in refElements)
            {
                var projectNameElement = reference.Element("Name");
                if (projectNameElement != null)
                {
                    packages.Add(new Package(projectNameElement.Value, "-", "projectreference"));
                }
                else
                {
                    var projectIncludeName = reference.Attribute("Include")?.Value;
                    if (projectIncludeName != null)
                    {
                        var packageName = Path.GetFileNameWithoutExtension(projectIncludeName);                      

                        packages.Add(new Package(packageName, "-", "projectreference"));
                    }
                }
            }

            return packages;
        }

        private static List<Package> GetPackageReferences(XDocument projDefinition)
        {
            var packages = new List<Package>();

            var refElements = projDefinition.Element("Project")?.Elements("ItemGroup")?.Elements("PackageReference") ?? new List<XElement>();
                      
            foreach (var reference in refElements)
            {
                var projectName = reference.Attribute("Include")?.Value;

                if (projectName != null)
                {
                    var version = reference.Attribute("Version")?.Value;

                    if (version is null)
                    {
                        version = reference.Element("Version")?.Value ?? "-";
                    }

                    packages.Add(new Package(projectName, version, "nuget"));
                }
            }

            return packages;
        }
    }
}
