using Collector.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Xml.Linq;

namespace Collector
{
    public class OldProjectFileReader : IFileReader
    {
        private readonly string projectFilePath;

        public OldProjectFileReader(string projectFilePath)
        {
            this.projectFilePath = projectFilePath;
        }

        public ICollection<Package> ReadDependencies()
        {
            if (!File.Exists(projectFilePath))
                return new Package[0];

            XDocument projDefinition = XDocument.Load(projectFilePath);
            var packages = new List<Package>();
            packages.AddRange(GetProjectReferences(projDefinition));
            packages.AddRange(GetPackageReferences(projDefinition));

            return packages;
        }

        private static List<Package> GetProjectReferences(XDocument projDefinition)
        {
            XNamespace msbuild = "http://schemas.microsoft.com/developer/msbuild/2003";
            var packages = new List<Package>();

            var refElements = projDefinition.Element(msbuild + "Project")?.Elements(msbuild + "ItemGroup")?.Elements(msbuild + "ProjectReference")?? new List<XElement>();

            foreach (var reference in refElements)
            {
                var projectNameElement = reference.Element(msbuild + "Name");
                if (projectNameElement != null)
                {
                    packages.Add(new Package(projectNameElement.Value, "-", "projectreference"));
                }
            }

            return packages;
        }

        private static List<Package> GetPackageReferences(XDocument projDefinition)
        {
            XNamespace msbuild = "http://schemas.microsoft.com/developer/msbuild/2003";
            var packages = new List<Package>();
            try
            {
                var refElements = projDefinition
                    .Element(msbuild + "Project")
                    .Elements(msbuild + "ItemGroup")
                    .Elements(msbuild + "PackageReference");

                foreach (var reference in refElements)
                {
                    var projectName = reference.Attribute("Include").Value;
                    var version = reference.Attribute("Version")?.Value;

                    if (version is null)
                    {
                        version = reference.Element(msbuild + "Version")?.Value??"-";
                    }                  

                    packages.Add(new Package(projectName, version, "nuget"));
                }
            }
            catch { }
            return packages;
        }
    }
}
