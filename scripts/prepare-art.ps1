# Reproducible crop/mask preparation of generated PNG artwork. No new art is drawn.
# Run from the repository root after placing the documented source atlases.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
public static class ArtBounds {
  public static void CleanIslands(Bitmap image) {
    // Atlas cells can contain a sliver of their neighbor. Keep the connected
    // jacket silhouette and its two-pixel antialiased edge, not those slivers.
    int w=image.Width, h=image.Height;
    bool[] visited=new bool[w*h];
    var largest=new System.Collections.Generic.List<int>();
    for(int start=0;start<w*h;start++) {
      if(visited[start] || image.GetPixel(start%w,start/w).A<24) continue;
      var component=new System.Collections.Generic.List<int>();
      var queue=new System.Collections.Generic.Queue<int>(); queue.Enqueue(start); visited[start]=true;
      while(queue.Count>0) {
        int p=queue.Dequeue(); component.Add(p);
        for(int dy=-1;dy<=1;dy++) for(int dx=-1;dx<=1;dx++) {
          int x=p%w+dx, y=p/w+dy;
          if(x<0 || x>=w || y<0 || y>=h) continue;
          int n=y*w+x;
          if(visited[n] || image.GetPixel(x,y).A<24) continue;
          visited[n]=true; queue.Enqueue(n);
        }
      }
      if(component.Count>largest.Count) largest=component;
    }
    bool[] keep=new bool[w*h];
    foreach(int p in largest) for(int dy=-2;dy<=2;dy++) for(int dx=-2;dx<=2;dx++) {
      int x=p%w+dx, y=p/w+dy;
      if(x>=0 && x<w && y>=0 && y<h) keep[y*w+x]=true;
    }
    for(int p=0;p<w*h;p++) if(!keep[p]) image.SetPixel(p%w,p/w,Color.Transparent);
  }
  public static Rectangle Find(Bitmap image, Rectangle cell) {
    int left=cell.Right, top=cell.Bottom, right=-1, bottom=-1;
    for (int y=cell.Top; y<cell.Bottom; y++) for (int x=cell.Left; x<cell.Right; x++) {
      if (image.GetPixel(x,y).A < 24) continue;
      left=Math.Min(left,x); top=Math.Min(top,y); right=Math.Max(right,x); bottom=Math.Max(bottom,y);
    }
    if (right < left) throw new Exception("Empty art cell");
    return Rectangle.FromLTRB(Math.Max(cell.Left,left-1),Math.Max(cell.Top,top-1),Math.Min(cell.Right,right+2),Math.Min(cell.Bottom,bottom+2));
  }
}
'@
foreach ($directory in @('assets/art/garments','assets/art/icons')) {
  if (-not (Test-Path -LiteralPath $directory)) { New-Item -Path $directory -ItemType Directory | Out-Null }
}
function Export-Cell($Source, $Name, $Rect, $Directory='garments') {
  $image = [Drawing.Bitmap]::new((Join-Path (Get-Location) "assets/art/source/$Source.png"))
  $cell = [Drawing.Rectangle]::new($Rect[0],$Rect[1],$Rect[2],$Rect[3])
  $bounds = [ArtBounds]::Find($image, $cell)
  $output = $image.Clone($bounds, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
  if ($Name -in @('shell','coat')) { [ArtBounds]::CleanIslands($output) }
  $output.Save((Join-Path (Get-Location) "assets/art/$Directory/$Name.png"), [Drawing.Imaging.ImageFormat]::Png)
  Write-Output "$Name $($bounds.Width)x$($bounds.Height)"
  $output.Dispose(); $image.Dispose()
}
Export-Cell wardrobe-upper tee @(0,0,535,490)
Export-Cell wardrobe-upper longsleeve @(535,0,480,490)
Export-Cell wardrobe-upper sweater @(1015,0,521,490)
Export-Cell wardrobe-upper shell @(0,490,540,534)
Export-Cell wardrobe-upper coat @(540,490,510,534)
Export-Cell wardrobe-lower shorts @(0,0,512,665)
Export-Cell wardrobe-lower chinos @(512,0,512,665)
Export-Cell wardrobe-lower joggers @(1024,0,512,665)
Export-Cell wardrobe-lower sneakers @(0,665,512,359)
Export-Cell wardrobe-lower ankleboots @(512,665,512,359)
Export-Cell wardrobe-lower winterboots @(1024,665,512,359)
Export-Cell wardrobe-hats sunhat @(0,0,1110,887)
Export-Cell wardrobe-hats beanie @(1110,0,664,887)
$rows = @(@(0,439),@(439,361),@(800,454))
$names = @('sunny','cloudy','rain','snow','storm','umbrella','sun','hydration','cold')
for ($index=0; $index -lt 9; $index++) {
  $row=[int][Math]::Floor($index/3); $column=$index%3
  $left=[int][Math]::Floor($column*1254/3); $right=[int][Math]::Floor(($column+1)*1254/3)
  Export-Cell weather-reminders $names[$index] @($left,$rows[$row][0],($right-$left),$rows[$row][1]) icons
}

# Preserve the generated head/neck, arms and legs; remove the original clothes.
# These paths are clipping masks only. All visible pixels come from the master PNG.
$master=[Drawing.Bitmap]::new((Join-Path (Get-Location) 'assets/art/character-master.png'))
function Export-Masked($Name, $Polygons) {
  $output=[Drawing.Bitmap]::new(1024,1536,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics=[Drawing.Graphics]::FromImage($output)
  $path=[Drawing.Drawing2D.GraphicsPath]::new()
  foreach ($polygon in $Polygons) {
    $points=[Drawing.PointF[]]@($polygon | ForEach-Object { [Drawing.PointF]::new($_[0],$_[1]) })
    $path.AddPolygon($points)
  }
  $graphics.SetClip($path)
  $graphics.DrawImage($master,0,0,1024,1536)
  $output.Save((Join-Path (Get-Location) "assets/art/$Name.png"), [Drawing.Imaging.ImageFormat]::Png)
  $path.Dispose(); $graphics.Dispose(); $output.Dispose()
}
$head=@(@(0,0),@(1024,0),@(1024,295),@(565,295),@(584,310),@(560,330),@(509,340),@(450,329),@(432,311),@(460,295),@(0,295))
$leftArm=@(@(325,514),@(381,535),@(365,607),@(341,742),@(352,790),@(355,865),@(331,878),@(301,851),@(282,815),@(292,742),@(297,635),@(312,572))
$rightArm=@(@(647,537),@(694,513),@(707,572),@(724,644),@(733,744),@(749,805),@(730,847),@(691,872),@(672,848),@(681,787),@(689,748),@(667,647))
$leftLeg=@(@(393,913),@(504,915),@(495,1034),@(476,1195),@(453,1343),@(400,1345),@(410,1205),@(408,1085),@(395,1000))
$rightLeg=@(@(524,915),@(642,913),@(637,1048),@(642,1207),@(642,1349),@(582,1349),@(575,1217),@(543,1050))
Export-Masked base @($head,$leftArm,$rightArm,$leftLeg,$rightLeg)
$master.Dispose()
