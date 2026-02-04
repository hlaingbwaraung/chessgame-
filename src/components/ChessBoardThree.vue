<template>
  <div class="three-container" ref="container"></div>
</template>

<script>
import * as THREE from 'three';

export default {
  name: 'ChessBoardThree',
  props: {
    game: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      boardGroup: null,
      pieces: {},
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      animationId: null
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.init();
    });
  },
  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('click', this.onMouseClick);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer) {
      this.renderer.dispose();
    }
  },
  methods: {
    init() {
      const container = this.$refs.container;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a2e);

      // Camera
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      this.camera.position.set(5, 6, 5);
      this.camera.lookAt(4, 0, 4);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      container.appendChild(this.renderer.domElement);

      // Lights - Very bright
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      directionalLight.shadow.camera.left = -20;
      directionalLight.shadow.camera.right = 20;
      directionalLight.shadow.camera.top = 20;
      directionalLight.shadow.camera.bottom = -20;
      this.scene.add(directionalLight);

      // Create board
      this.createBoard();

      // Create pieces
      this.createPieces();

      // Events
      window.addEventListener('click', this.onMouseClick);
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('resize', this.onWindowResize);

      // Animate
      this.animate();
    },

    createBoard() {
      this.boardGroup = new THREE.Group();

      // Board squares
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const isLight = (row + col) % 2 === 0;
          const color = isLight ? 0xf5deb3 : 0x8b7355;

          const geometry = new THREE.PlaneGeometry(1, 1);
          const material = new THREE.MeshLambertMaterial({ color: color });
          const square = new THREE.Mesh(geometry, material);

          square.position.set(col, 0, row);
          square.rotation.x = -Math.PI / 2;
          square.receiveShadow = true;
          square.userData = { row, col };

          this.boardGroup.add(square);
        }
      }

      // Border
      const borderGeometry = new THREE.BoxGeometry(8.2, 0.3, 8.2);
      const borderMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      const border = new THREE.Mesh(borderGeometry, borderMaterial);
      border.position.set(3.5, -0.2, 3.5);
      border.castShadow = true;
      this.boardGroup.add(border);

      this.boardGroup.position.set(-3.5, 0, -3.5);
      this.scene.add(this.boardGroup);
    },

    createPieces() {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.game.board[row][col];
          if (piece) {
            this.createPiece(row, col, piece);
          }
        }
      }
    },

    createPiece(row, col, piece) {
      const symbols = {
        pawn: '♟',
        knight: '♞',
        bishop: '♝',
        rook: '♜',
        queen: '♛',
        king: '♚'
      };

      // Canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = piece.color === 'white' ? '#ffff ff' : '#000000';
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = piece.color === 'white' ? '#000000' : '#ffffff';
      ctx.font = 'bold 180px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbols[piece.type], 128, 130);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshLambertMaterial({ map: texture });

      const geometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 32);
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(col, 0.15, row);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { row, col, piece };

      this.boardGroup.add(mesh);
      this.pieces[`${row}-${col}`] = mesh;
    },

    updatePieces() {
      Object.keys(this.pieces).forEach(key => {
        this.boardGroup.remove(this.pieces[key]);
      });
      this.pieces = {};
      this.createPieces();
    },

    onMouseClick(event) {
      const rect = this.$refs.container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      const objects = [];
      this.boardGroup.traverse(child => {
        if (child instanceof THREE.Mesh && child.userData.row !== undefined) {
          objects.push(child);
        }
      });

      const intersects = this.raycaster.intersectObjects(objects);

      if (intersects.length > 0) {
        const { row, col } = intersects[0].object.userData;
        this.game.selectSquare(row, col);
        this.updatePieces();
      }
    }

    onMouseMove(event) {
      // Optional: add hover effects
    }

    onWindowResize() {
      if (!this.$refs.container) return;
      const width = this.$refs.container.clientWidth;
      const height = this.$refs.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    animate() {
      this.animationId = requestAnimationFrame(this.animate);
      Object.values(this.pieces).forEach(piece => {
        piece.rotation.y += 0.003;
      });
      this.renderer.render(this.scene, this.camera);
    }
  }
}
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
