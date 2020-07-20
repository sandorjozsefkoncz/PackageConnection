namespace Collector.Models
{
    public class Package
    {
        public string Id { get; set; }
        public string Version { get; set; }

        public string RefType { get; set; }

        public Package(string id, string version, string refType)
        {
            Id = id;
            Version = version;
            RefType = refType;
        }

        public string GetId()
        {
            return Id;
        }

        public override string ToString()
        {
            return $"{Id}: {Version}";
        }
    }
}
