// A headless MarkovJunior (github.com/mxgmn/MarkovJunior, MIT, © 2022 Maxim Gumin) for the comparisons of T335: as the harness of
// T334 (lab/banco/inferenza/originale), it runs one model with one seed and prints the grid in text; here Graphics.LoadBitmap reads the
// PNG samples (8-bit grey, RGB or RGBA, not interlaced) without ImageSharp, and VoxHelper reads the .vox tiles and rules as the original.
//   dotnet out/mj.dll <model.xml> <MX> <MY> <MZ> <seed> <steps>   (from a folder that holds the original's resources/)
// Output: STEPS <n>, COUNTS <letter:cells,...>, GRID <X> <Y> <Z> and the letters of the cells (x fastest, then y, then z upwards).
using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Xml.Linq;

static class Graphics
{
    public static (int[], int, int, int) LoadBitmap(string filename)
    {
        try
        {
            byte[] b = File.ReadAllBytes(filename);
            int i = 8, W = 0, H = 0, type = 0;
            var idat = new MemoryStream();
            while (i < b.Length)
            {
                int n = (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3];
                string id = System.Text.Encoding.ASCII.GetString(b, i + 4, 4);
                if (id == "IHDR")
                {
                    W = (b[i + 8] << 24) | (b[i + 9] << 16) | (b[i + 10] << 8) | b[i + 11];
                    H = (b[i + 12] << 24) | (b[i + 13] << 16) | (b[i + 14] << 8) | b[i + 15];
                    if (b[i + 16] != 8) return (null, -1, -1, -1);
                    type = b[i + 17];
                }
                else if (id == "IDAT") idat.Write(b, i + 8, n);
                i += 12 + n;
            }
            int ch = type == 0 ? 1 : type == 2 ? 3 : type == 4 ? 2 : type == 6 ? 4 : 0;
            if (ch == 0) return (null, -1, -1, -1);
            idat.Position = 0;
            var raw = new MemoryStream();
            using (var z = new ZLibStream(idat, CompressionMode.Decompress)) z.CopyTo(raw);
            byte[] r = raw.ToArray();
            int stride = W * ch;
            byte[] img = new byte[H * stride];
            for (int y = 0; y < H; y++)
            {
                int f = r[y * (stride + 1)];
                for (int x = 0; x < stride; x++)
                {
                    int v = r[y * (stride + 1) + 1 + x];
                    int a = x >= ch ? img[y * stride + x - ch] : 0, up = y > 0 ? img[(y - 1) * stride + x] : 0, c = y > 0 && x >= ch ? img[(y - 1) * stride + x - ch] : 0;
                    int p = a + up - c, pa = Math.Abs(p - a), pb = Math.Abs(p - up), pc = Math.Abs(p - c);
                    int paeth = pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
                    int add = f == 1 ? a : f == 2 ? up : f == 3 ? (a + up) >> 1 : f == 4 ? paeth : 0;
                    img[y * stride + x] = (byte)((v + add) & 255);
                }
            }
            int[] result = new int[W * H];
            for (int k = 0; k < W * H; k++)
            {
                int o = k * ch;
                int R = img[o], G = ch >= 3 ? img[o + 1] : img[o], B = ch >= 3 ? img[o + 2] : img[o];
                int A = ch == 4 ? img[o + 3] : ch == 2 ? img[o + 1] : 255;
                result[k] = (A << 24) | (R << 16) | (G << 8) | B;
            }
            return (result, W, H, 1);
        }
        catch (Exception) { return (null, -1, -1, -1); }
    }
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
