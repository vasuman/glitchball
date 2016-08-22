function Bitmap(t,e){this.can=document.createElement("canvas"),this.ctx=this.can.getContext("2d"),this.width=this.can.width=t,this.height=this.can.height=e}function Body(){this.bounds=new Box,this.pos=new V,this.vel=new V,this.acc=new V}function V(t,e){this.x=t||0,this.y=e||0}function Box(t,e,n,o){this.x=t||0,this.y=e||0,this.w=n||0,this.h=o||0}function MoveEvent(t,e){this.type=EventType.INPUT,this.action=InputAction.MOVE,this.target=t,this.direction=e}function main(){input.init(document);var t=document.getElementById("main");renderer.init(t),loop.start()}function World(t,e){this.tick=0,this.arena=new Box(0,0,t,e),this.one={left:!0,body:new Body},this.two={left:!1,body:new Body},this.ball={body:new Body,attached:!1},this.state=GameState.PLAY,this._players=[this.one,this.two],this._entities=[this.ball,this.two,this.one],this.one.body.bounds.setDim(ENT_SIZE,ENT_SIZE),this.two.body.bounds.setDim(ENT_SIZE,ENT_SIZE),this.ball.body.bounds.setDim(BALL_SIZE,BALL_SIZE)}Bitmap.prototype.drawBox=function(t){this.ctx.fillRect(t.x,t.y,t.w,t.h)},Bitmap.prototype.drawCircle=function(t,e){this.ctx.beginPath(),this.ctx.arc(t.x,t.y,e,0,2*Math.PI),this.ctx.fill()},Bitmap.prototype.clear=function(){this.ctx.clearRect(0,0,this.width,this.height)};var DAMPENING=.95;Body.prototype.update=function(t){this.vel.fAdd(t,this.acc),this.pos.fAdd(t,this.vel),this.vel.scale(DAMPENING),this.acc.set(0,0),this._reBound()},Body.prototype.at=function(t,e){this.pos.set(t,e),this._reBound()},Body.prototype._reBound=function(){this.bounds.setCenter(this.pos)};var Direction={UP:1,DOWN:2,LEFT:3,RIGHT:4};V.prototype.round=function(){this.x=Math.round(this.x),this.y=Math.round(this.y)},V.prototype.add=function(t){this.x+=t.x,this.y+=t.y},V.prototype.fAdd=function(t,e){this.x+=t*e.x,this.y+=t*e.y},V.prototype.scale=function(t){this.x*=t,this.y*=t},V.prototype.length=function(){return Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2))},V.prototype.set=function(t,e){this.x=t,this.y=e},V.prototype.from=function(t){this.x=t.x,this.y=t.y},V.prototype.fromDirection=function(t){switch(t){case Direction.UP:this.y-=1;break;case Direction.DOWN:this.y+=1;break;case Direction.LEFT:this.x-=1;break;case Direction.RIGHT:this.x+=1}},V.prototype.normalize=function(){var t=this.length();0!==t&&this.scale(1/t)},Box.prototype.center=function(t){return t||(t=new V),t.x=this.x+this.w/2,t.y=this.y+this.h/2,t},Box.prototype.setCenter=function(t){this.x=t.x-this.w/2,this.y=t.y-this.h/2},Box.prototype.setDim=function(t,e){this.w=t,this.h=e},Box.prototype.contains=function(t){return this.x<=t.x&&t.x+t.w<=this.x+this.w&&this.y<=t.y&&t.y+t.h<=this.y+this.h},Box.prototype.intersects=function(t){return this.x<=t.x+t.w&&t.x<=this.x+this.w&&this.y<=t.y+t.h&&t.y<=this.y+this.h};var SHIFT_KEY=16,SPACE_KEY=32,ARROW_KEY_MAP={38:Direction.UP,40:Direction.DOWN,37:Direction.LEFT,39:Direction.RIGHT},WSAD_KEY_MAP={87:Direction.UP,83:Direction.DOWN,65:Direction.LEFT,68:Direction.RIGHT},oneKeyMap={move:WSAD_KEY_MAP,glitch:SHIFT_KEY},twoKeyMap={move:ARROW_KEY_MAP,glitch:SPACE_KEY},InputAction={MOVE:1,GLITCH:2},InputTarget={ONE:1,TWO:2},input=function(){function t(t){t.addEventListener("keydown",function(t){var e=t.keyCode;i[e]||(i[e]=!0,e===oneKeyMap.glitch?e.x():e===twoKeyMap.glitch&&e.x())}),t.addEventListener("keyup",function(t){delete i[t.keyCode]})}function e(){var t,e;o.splice(0,o.length),n.splice(0,n.length);for(t in i)oneKeyMap.move.hasOwnProperty(t)?(e=oneKeyMap.move[t],o.push(new MoveEvent(InputTarget.ONE,e))):twoKeyMap.move.hasOwnProperty(t)&&(e=twoKeyMap.move[t],o.push(new MoveEvent(InputTarget.TWO,e)));return o}var n=[],o=[],i={};return{init:t,poll:e}}(),loop=function(){function t(){i=!0,s=new World(1e3,600),s.initial(),n()}function e(){i=!1}function n(){o(),s.process(a),s.step(1/60),renderer.draw(s),i&&window.requestAnimationFrame(n)}function o(){a.splice(0,a.length),Array.prototype.push.apply(a,input.poll())}var i,s,a=[];return{start:t,stop:e}}();window.addEventListener("load",main);var renderer=function(){function t(t){a(),t.appendChild(c.can)}function e(t){o(),p.ctx.globalAlpha=.8,p.ctx.globalAlpha=1,i(t.one,"blue"),i(t.two,"red"),s(t.ball),c.ctx.drawImage(d.can,0,0),c.ctx.drawImage(p.can,0,0)}function n(){return c.can}function o(){p.clear(),c.clear()}function i(t,e){p.ctx.fillStyle=e,p.drawBox(t.body.bounds)}function s(t){p.ctx.fillStyle="green",p.drawCircle(t.body.pos,t.body.bounds.w/2)}function a(){d.ctx.lineWidth=10,d.ctx.strokeRect(0,0,h,r),d.ctx.lineWidth=2,d.ctx.beginPath(),d.ctx.moveTo(h/2,0),d.ctx.lineTo(h/2,r/2-10),d.ctx.moveTo(h/2,r/2+10),d.ctx.lineTo(h/2,r),d.ctx.stroke()}var h=1e3,r=600,c=new Bitmap(h,r),p=new Bitmap(h,r),d=new Bitmap(h,r);return{init:t,getElement:n,draw:e}}(),SIDE_MARGIN=50,ACC_FACTOR=350,ENT_SIZE=10,BALL_SIZE=10,EventType={INPUT:1},GameState={PLAY:1,GLITCH:2};World.prototype.initial=function(){this._newRound(!0)},World.prototype.process=function(t){var e=this;t.forEach(function(t){switch(t.type){case EventType.INPUT:e.handleInput(t);break;default:throw new Error("unknown event type")}})},World.prototype.step=function(t){var e,n,o=this.ball;this.tick+=1,this._players.forEach(function(e){e.body.acc.normalize(),e.body.acc.scale(ACC_FACTOR),e.body.update(t)}),o.attached?(e=o.attached.body.pos,o.body.at(e.x,e.y),n=o.attached===this.one?this.two:this.one,n.body.bounds.intersects(o.body.bounds)&&(this._doSpawn(o.attached),this._doSpawn(n),o.attached=!1)):(o.body.update(t),this._players.forEach(function(t){t.body.bounds.intersects(o.body.bounds)&&(o.attached=t)})),this._entities.forEach(function(e){e.body.update(t)})},World.prototype.handleInput=function(t){var e=this._getTarget(t.target);switch(t.action){case InputAction.MOVE:e.body.acc.fromDirection(t.direction);break;default:throw new Error("unknown action")}},World.prototype._getTarget=function(t){switch(t){case InputTarget.ONE:return this.one;case InputTarget.TWO:return this.two;default:throw new Error("unknown target")}},World.prototype._newRound=function(t){t?(this._doSpawn(this.one),this._doStart(this.two)):(this._doStart(this.one),this._doSpawn(this.two)),this.ball.body.at(this.arena.w/2,this.arena.h/2),this.ball.attached=!1},World.prototype._doSpawn=function(t){t.left?t.body.at(SIDE_MARGIN,this.arena.h/2):t.body.at(this.arena.w-SIDE_MARGIN,this.arena.h/2)},World.prototype._doStart=function(t){t.left?t.body.at(this.arena.w/2-SIDE_MARGIN,this.arena.h/2):t.body.at(this.arena.w/2+SIDE_MARGIN,this.arena.h/2)};