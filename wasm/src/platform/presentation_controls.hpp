#pragma once
#include "ui/turn_presentation.hpp"
namespace nuclear::player {
// Holds accelerate a visible turn timeline, not just its travelling projectile.
// Human decisions (including the persistent propaganda result) still require input.
inline bool turn_hold_eligible(const ActionPresentation &scene) {
    return scene.active() &&
           (!scene.human_console() || scene.automatic_production()) &&
           !(scene.event().action == 3 && scene.instant_result());
}
inline bool selection_control_at(int x, int y) {
    for (auto g : player_assets::gadgets)
        if (g.id >= 97 && g.id <= 122 && Rect{g.x,g.y,g.w,g.h}.contains(x,y)) return true;
    for (auto r : {Rect{0,0,68,42},Rect{0,149,68,42},Rect{251,0,69,42},Rect{251,149,69,42},Rect{100,58,124,80}})
        if(r.contains(x,y)) return true;
    return false;
}
}
