// Compile against the read-only desktop include/source paths and its game library.
#include "rendering/renderer.hpp"
int main(int argc,char **argv) {
 if(argc<2)return 2;
 Renderer display;Player player(1);player.enter_selection();player.click(110,20);
 ActionEvent event;event.actor=0;event.region=EventRegion::speech;
 event.identity=player.coordinator()->data().state.identity[0];
 event.speech="I will crush you!";
 auto scene=ActionPresentation::replay_event(event,player.coordinator()->data().state);
 scene.typing_speed(1000);scene.tick(1);display.visual_seconds=1;
 display.render(player,false,&scene);display.capture(argv[1]);
 SDL_RenderPresent(display.renderer);
}
