// Optional native diagnostic: compare original desktop compression to native glyph pixels.
#include "platform/resources.hpp"
#include <SDL.h>
#include <iostream>
int main() {
 SDL_Init(SDL_INIT_VIDEO);
 auto image=nuclear::assets::image("bitmap_font");
 auto *surface=SDL_CreateRGBSurfaceWithFormat(0,20,8,32,SDL_PIXELFORMAT_RGBA32);
 auto *renderer=SDL_CreateSoftwareRenderer(surface);
 auto *texture=SDL_CreateTexture(renderer,SDL_PIXELFORMAT_RGBA32,SDL_TEXTUREACCESS_STATIC,image.width,image.height);
 SDL_UpdateTexture(texture,nullptr,image.rgba.data(),image.width*4);SDL_SetTextureBlendMode(texture,SDL_BLENDMODE_BLEND);SDL_SetTextureColorMod(texture,187,0,0);
 SDL_SetRenderDrawColor(renderer,255,255,255,255);SDL_RenderClear(renderer);
 SDL_Rect original{('A'-32)*6,0,6,8},oldDestination{0,0,5,7},trimmed{('A'-32)*6,0,5,8},newDestination{10,0,5,8};
 SDL_RenderCopy(renderer,texture,&original,&oldDestination);SDL_RenderCopy(renderer,texture,&trimmed,&newDestination);
 unsigned char pixels[20*8*4];SDL_RenderReadPixels(renderer,nullptr,SDL_PIXELFORMAT_RGBA32,pixels,20*4);
 for(int side:{0,10}){std::cout<<(side?"native 5x8 glyph":"old 6x8 -> 5x7")<<'\n';for(int y=0;y<8;y++){for(int x=0;x<5;x++)std::cout<<(pixels[(y*20+side+x)*4+1]==0?'#':'.');std::cout<<'\n';}}
 SDL_DestroyTexture(texture);SDL_DestroyRenderer(renderer);SDL_FreeSurface(surface);SDL_Quit();
}
