// What System.Random of .NET draws from a seed (T500): the numbers the TypeScript copy (lab/banco/conformita/riferimento.ts, DotnetRandom)
// must draw. For every seed of the list it prints, interleaved as MarkovJunior asks them, Next(), Next(n) for some n and NextDouble()
// written as the 64 bits of the double, so no rounding of the text hides a difference.
//   dotnet caso.dll <seed,seed,...> <draws>
using System;
using System.Linq;

static class Program
{
    static void Main(string[] args)
    {
        int[] seeds = args[0].Split(',').Select(int.Parse).ToArray();
        int draws = int.Parse(args[1]);
        int[] maxima = { 1, 2, 3, 7, 10, 100, 1000, 65536, 1 << 30, int.MaxValue };
        foreach (int seed in seeds)
        {
            Random r = new Random(seed);
            Console.Write($"SEED {seed}");
            for (int k = 0; k < draws; k++)
            {
                switch (k % 3)
                {
                    case 0: Console.Write($" N{r.Next()}"); break;
                    case 1: Console.Write($" M{r.Next(maxima[k % maxima.Length])}"); break;
                    default: Console.Write($" D{BitConverter.DoubleToInt64Bits(r.NextDouble())}"); break;
                }
            }
            Console.WriteLine();
        }
    }
}
