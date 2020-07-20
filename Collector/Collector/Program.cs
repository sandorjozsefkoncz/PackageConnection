using Collector.Models;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Collector
{
    class Program
    {
        static void Main(string[] args)
        {
            var configuration = JsonConvert.DeserializeObject<Models.Configuration>(File.ReadAllText("configuration.json"));

            var allproject = new List<string>();

            foreach (var path in configuration.Folders)
            {
                allproject.AddRange(Directory.GetFiles(path, "*.csproj", SearchOption.AllDirectories));
            }

            var codeProjects = allproject.Where(p => !p.Contains(@"\test")).ToList();

            var dependencyBuilder = new DependencyBuilder();

            foreach (var p in codeProjects)
            {
                var applicationName = Path.GetFileNameWithoutExtension(p);
                var folder = Path.GetDirectoryName(p);

                var packages = new List<Package>();
                packages.AddRange(new PackagesFileReader(Path.Combine(folder, "packages.config")).ReadDependencies());
                packages.AddRange(new OldProjectFileReader(p).ReadDependencies());
                packages.AddRange(new NewProjectFileReader(p).ReadDependencies());

                var app = new Application(applicationName, packages.ToArray());

                dependencyBuilder.AddApplication(app);               
            }

            var graph = dependencyBuilder.Build(configuration);

            var json = JsonConvert.SerializeObject(graph, Formatting.Indented);

            File.WriteAllText(configuration.ResultPath, json);
        }
    }
}
