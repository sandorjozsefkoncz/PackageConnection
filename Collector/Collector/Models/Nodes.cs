using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace Collector.Models
{

    public class DependencyGraph
    {
        [JsonProperty("nodes")]
        public IList<Node> Nodes { get; set; }

        [JsonProperty("links")]
        public IList<Link> Links { get; set; }

        public DependencyGraph()
        {
            Links = new List<Link>();
            Nodes = new List<Node>();
        }

        public void AddNode(Node node)
        {
            if (!Nodes.Any(n => n.Id.Equals(node.Id)))
                Nodes.Add(node);
        }

        public void AddLink(Link link)
        {
            if (!Links.Any(l => l.Source.Equals(link.Source) && l.Target.Equals(link.Target)))
                Links.Add(link);
        }
    }

    public class Node
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("class")]
        public string Class { get; set; }
    }

    public class Link
    {
        [JsonProperty("source")]
        public string Source { get; set; }

        [JsonProperty("target")]
        public string Target { get; set; }

        [JsonProperty("type")]
        public string Type { get; set; }
    }
}
