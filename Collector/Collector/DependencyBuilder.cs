using Collector.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;

namespace Collector
{
    internal class DependencyBuilder
    {
        public IList<Application> Applications { get; } = new List<Application>();

        public DependencyBuilder()
        {
        }

        internal void AddApplication(Application a)
        {
            Applications.Add(a);
        }

        internal DependencyGraph Build(Configuration config)
        {
            var graph = new DependencyGraph();

            foreach (var application in Applications)
            {
                //Adding rootnode
                var applicationId = application.GetId();
                graph.AddNode(CreateNode(applicationId, config));

                var relevantPackages = application.Packages.Where(x =>  config.CanInclude(x.Id)).ToList();

                foreach (var package in relevantPackages)
                {
                    var packageId = package.GetId();
                    graph.AddNode(CreateNode(packageId, config));

                    var link = new Link() { Source = applicationId, Target = packageId, Type = package.RefType };
                    graph.AddLink(link);
                }
            }

            graph.Nodes = graph.Nodes.OrderBy(p => p.Class).ToArray();
            graph.Links = graph.Links.OrderBy(p => p.Target).ToArray();

            return FilterGraph(graph, config);
        }

        private DependencyGraph FilterGraph(DependencyGraph graph, Configuration config)
        {
            if (!config.DependsOn.Any() && !config.DependencyOf.Any())
                return graph;

            var relevantLinks = new List<Link>();

            relevantLinks.AddRange(graph.Links
                .Where(l => config.DependsOn.Any(t => l.Target.Equals(t, StringComparison.InvariantCultureIgnoreCase)))
                .ToList());

            relevantLinks.AddRange(graph.Links
                .Where(l => config.DependencyOf.Any(t => l.Source.Equals(t, StringComparison.InvariantCultureIgnoreCase)))
                .ToList());

            var relevantNodes = graph.Nodes.Where(n => relevantLinks.Any(l => l.Target.Equals(n.Id) || l.Source.Equals(n.Id))).ToList();

            return new DependencyGraph()
            {
                Nodes = relevantNodes,
                Links = relevantLinks,
            };
        }

        public Node CreateNode(string id, Configuration config)
        {
            return new Node() { Class = GetPackageClass(id, config).ToLower(), Id = id, Name = id };
        }

        public string GetPackageClass(string id, Configuration config)
        {
            var map = config.Map;

            foreach (var m in map)
            {
                if (id.StartsWith(m.Key))
                    return m.Value;
            }

            return "package";        
        }
    }
}