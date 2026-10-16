"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useStore } from "@/store/useStore";

export default function WorkspaceRoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveModal, activeModal } = useStore();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d12);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 3, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Room Group
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    const grid = new THREE.GridHelper(20, 20, 0x3b82f6, 0x2a2a3c);
    grid.position.y = -0.99;
    roomGroup.add(grid);

    // Desk
    const deskGeo = new THREE.BoxGeometry(3.2, 0.1, 1.6);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.4 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0, 0);
    desk.castShadow = true;
    desk.receiveShadow = true;
    roomGroup.add(desk);

    // Desk Legs
    const legGeo = new THREE.BoxGeometry(0.1, 1, 0.1);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [
      [-1.4, -0.5, -0.6],
      [1.4, -0.5, -0.6],
      [-1.4, -0.5, 0.6],
      [1.4, -0.5, 0.6],
    ].forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      roomGroup.add(leg);
    });

    // Laptop (Projects Hotspot)
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(0, 0.05, 0);
    roomGroup.add(laptopGroup);

    const baseGeo = new THREE.BoxGeometry(1.0, 0.04, 0.7);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const laptopBase = new THREE.Mesh(baseGeo, baseMat);
    laptopGroup.add(laptopBase);

    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0.02, -0.32);
    laptopGroup.add(screenGroup);

    const screenBoxGeo = new THREE.BoxGeometry(1.0, 0.7, 0.03);
    const screenBox = new THREE.Mesh(screenBoxGeo, baseMat);
    screenBox.position.set(0, 0.35, 0);
    screenGroup.add(screenBox);

    const displayGeo = new THREE.BoxGeometry(0.92, 0.62, 0.01);
    const displayMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.35, 0.02);
    screenGroup.add(display);

    laptopGroup.userData = { modal: 'projects' };

    // Cart Basket (Cart Hotspot)
    const basketGeo = new THREE.CylinderGeometry(0.4, 0.3, 0.7, 16);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.7 });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.set(1.8, -0.6, 0.8);
    basket.castShadow = true;
    basket.userData = { modal: 'cart' };
    roomGroup.add(basket);

    // Bookshelf (About Hotspot)
    const shelfGeo = new THREE.BoxGeometry(1.2, 3.5, 0.6);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21 });
    const bookshelf = new THREE.Mesh(shelfGeo, shelfMat);
    bookshelf.position.set(-2.5, 1, -3.5);
    bookshelf.castShadow = true;
    bookshelf.userData = { modal: 'about' };
    roomGroup.add(bookshelf);

    // Store Shelf (Store Hotspot)
    const storeShelf = new THREE.Mesh(shelfGeo, new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
    storeShelf.position.set(2.5, 1, -3.5);
    storeShelf.castShadow = true;
    storeShelf.userData = { modal: 'shop' };
    roomGroup.add(storeShelf);

    // Contact device
    const phoneGeo = new THREE.BoxGeometry(0.3, 0.02, 0.5);
    const phoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    const phone = new THREE.Mesh(phoneGeo, phoneMat);
    phone.position.set(0.8, 0.08, 0.4);
    phone.castShadow = true;
    phone.userData = { modal: 'contact' };
    roomGroup.add(phone);

    // Raycaster for clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(roomGroup.children, true);

      if (intersects.length > 0) {
        let obj: any = intersects[0].object;
        while (obj && !obj.userData?.modal && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.modal) {
          setActiveModal(obj.userData.modal);
        }
      }
    };

    window.addEventListener("click", onClick);

    // Mouse rotation controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngle = 0;
    let cameraHeight = 3;
    let cameraRadius = 6;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraAngle -= deltaX * 0.005;
      cameraHeight = Math.max(1, Math.min(6, cameraHeight + deltaY * 0.01));

      camera.position.x = Math.sin(cameraAngle) * cameraRadius;
      camera.position.z = Math.cos(cameraAngle) * cameraRadius;
      camera.position.y = cameraHeight;
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("click", onClick);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [setActiveModal]);

  return (
    <div ref={containerRef} className="w-screen h-screen absolute inset-0 bg-[#0d0d12] overflow-hidden" />
  );
}
