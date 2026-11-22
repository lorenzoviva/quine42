// A headless MarkovJunior for T498 (github.com/mxgmn/MarkovJunior, MIT, (c) 2022 Maxim Gumin): it runs one model, from an empty grid or
// from a grid written in text, for one seed or a range of seeds, and prints the steps and the grid in text. It replaces the original's
// Program.cs (with GUI.cs and Graphics.cs, which want ImageSharp); Interpreter.Run is copied below, with the start grid written in.
//   dotnet mj.dll <model.xml> <MX> <MY> <MZ> <seed | first-last> <steps> [<start.txt>]
// start.txt: the letters of the cells, x fastest, then y, then z upwards (whitespace ignored).
// Output for each seed: SEED <n>, STEPS <n>, FINISHED true|false, GRID <X> <Y> <Z>, one line per row (y from the back), the layers from
// the bottom with a blank line between them.
using System;
using System.IO;
using System.Linq;
using System.Xml.Linq;

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
        string[] range = args[4].Split('-');
        int first = int.Parse(range[0]), last = range.Length > 1 ? int.Parse(range[1]) : first;
        int steps = int.Parse(args[5]);
        string start = args.Length > 6 ? new string(File.ReadAllText(args[6]).Where(c => !char.IsWhiteSpace(c)).ToArray()) : null;
        Interpreter ip = Interpreter.Load(modeldoc.Root, MX, MY, MZ);
        if (ip == null) { Console.WriteLine("ERROR"); return; }
        Grid startgrid = ip.grid;
        for (int seed = first; seed <= last; seed++)
        {
            ip.random = new Random(seed);
            ip.grid = startgrid;
            Grid grid = ip.grid;
            grid.Clear();
            if (start != null) for (int i = 0; i < grid.state.Length; i++) grid.state[i] = grid.values[start[i]];
            else if (modeldoc.Root.Get("origin", false)) grid.state[grid.MX / 2 + (grid.MY / 2) * grid.MX + (grid.MZ / 2) * grid.MX * grid.MY] = 1;
            ip.changes.Clear();
            ip.first.Clear();
            ip.first.Add(0);
            ip.root.Reset();
            ip.current = ip.root;
            ip.counter = 0;
            while (ip.current != null && (steps <= 0 || ip.counter < steps))
            {
                ip.current.Go();
                ip.counter++;
                ip.first.Add(ip.changes.Count);
            }
            Grid g = ip.grid;
            Console.WriteLine($"SEED {seed}");
            Console.WriteLine($"STEPS {ip.counter}");
            Console.WriteLine($"FINISHED {(ip.current == null ? "true" : "false")}");
            Console.WriteLine($"GRID {g.MX} {g.MY} {g.MZ}");
            for (int z = 0; z < g.MZ; z++)
            {
                for (int y = 0; y < g.MY; y++)
                    Console.WriteLine(new string(Enumerable.Range(0, g.MX).Select(x => g.characters[g.state[x + y * g.MX + z * g.MX * g.MY]]).ToArray()));
                if (z < g.MZ - 1) Console.WriteLine();
            }
        }
    }
}
