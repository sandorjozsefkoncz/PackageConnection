using System.Collections.Generic;
using System.Linq;

namespace Collector.Models
{
    public class Configuration
    {
        public string ResultPath = "result.json";
        public string[] Folders { get; set; } = new string[0];

        public Dictionary<string, string> Map { get; set; } = new Dictionary<string, string>();

        public string[] IncludeOnly { get; set; } = new string[0];

        public string[] Ignore { get; set; } = new string[0];

        public string[] DependsOn { get; set; } = new string[0];
        public string[] DependencyOf { get; set; } = new string[0];


        public bool CanInclude(string input)
        {
            return ShouldInclude(input) && !ShouldIgnore(input);        
        }

        private bool ShouldInclude(string input)
        {
            if (!IncludeOnly.Any()) 
                return true;

            return IncludeOnly.Any(x => input.StartsWith(x));
        }

        private bool ShouldIgnore(string input)
        {
            if (!Ignore.Any())
                return false;

            return Ignore.Any(x => input.StartsWith(x));
        }
    }
}
