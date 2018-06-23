/// <reference path='typings/tsd.d.ts' />
import Scene from './cube';
import {GUI} from "dat.gui";
// a cube object
let scene = new Scene('#3dcube');

/**
 * Uses jQuery to update a div's contents
 * @param  {string} divName name of div to update
 * @param  {string} name    name of entity saying hello
 * @return {void}
 */
function showHello(divName: string) {

    $(`#${divName}`).text("Кубы");
}
showHello("greeting");

let obj = {
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    N: 1
};
/**
 * Takes the rotation on each axis of the cube and arbitrarily adds or subtracts
 * @return {void}
 */
function changeItUp() {
    scene.rotX = obj.rotX;
    scene.rotY = obj.rotY;
    scene.rotZ = obj.rotZ;
    scene.N =  obj.N;
}
/**
 * Begins rendering cube
 * @return {void}
 */
function render() {
    changeItUp();
    requestAnimationFrame(render);
    scene.render();
}

const gui: GUI = new GUI();

gui.remember(obj);
gui.add(obj, 'rotX').min(-Math.PI).max(Math.PI).step(Math.PI/360);
gui.add(obj, 'rotY').min(-Math.PI).max(Math.PI).step(Math.PI/360);
gui.add(obj, 'rotZ').min(-Math.PI).max(Math.PI).step(Math.PI/360);
gui.add(obj, 'N').min(0).max(10).step(1);

render();