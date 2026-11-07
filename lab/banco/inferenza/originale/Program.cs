// A headless MarkovJunior (github.com/mxgmn/MarkovJunior, MIT, © 2022 Maxim Gumin) for the comparisons of T334: it runs one model
// with one seed and prints what the grid ends as, in text, instead of the PNG and VOX files of the original Program.cs.
//   dotnet run -c Release -- <model.xml> <MX> <MY> <MZ> <seed> <steps>
// Output: STEPS <n>, COUNTS <letter:cells,...>, GRID <X> <Y> <Z> and the letters of the cells (x fastest, then y, then z upwards).
using System;
using System.Linq;
using System.Xml.Linq;

// The original reads images for rule files and samples (Graphics.cs needs ImageSharp): the models compared here use none.
static class Graphics
{
    public static (int[], int, int, int) LoadBitmap(string filename) => (null, -1, -1, -1);
}

static class Program
{
    static void Main(string[] args)
    {
        XDocument modeldoc = XDocument.Load(args[0], LoadOptions.SetLineInfo);
        int MX = int.Parse(args[1]), MY = int.Parse(args[2]), MZ = int.Parse(args[3]);
        int seed = int.Parse(args[4]), steps = int.Parse(args[5]);
        Interpreter interpreter = Interpreter.Load(modeldoc.Root, MX, MY, MZ);
        if (interpreter == null) { Console.WriteLine("ERROR"); return; }
        foreach ((byte[] result, char[] legend, int FX, int FY, int FZ) in interpreter.Run(seed, steps, false))
        {
            Console.WriteLine($"STEPS {interpreter.counter}");
            var counts = new System.Collections.Generic.SortedDictionary<char, int>();
            foreach (var b in result) { counts.TryGetValue(legend[b], out int n); counts[legend[b]] = n + 1; }
            Console.WriteLine("COUNTS " + string.Join(",", counts.Select(k => $"{k.Key}:{k.Value}")));
            Console.WriteLine($"GRID {FX} {FY} {FZ}");
            Console.WriteLine(new string(result.Select(b => legend[b]).ToArray()));
        }
    }
}
