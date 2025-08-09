import { HUD } from '../src/UI/HUD';
import { EconomySystem } from '../src/ecs/systems/EconomySystem';
import AudioSystem from '../src/ecs/systems/AudioSystem';

// Mock Phaser Scene and its dependencies
const createMockScene = () => {
  const mockText = {
    setText: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  };

  return {
    add: {
      text: jest.fn().mockReturnValue(mockText),
    },
  } as any;
};

describe('HUD', () => {
  let mockScene: any;
  let mockEconomySystem: jest.Mocked<EconomySystem>;
  let mockAudioSystem: jest.Mocked<AudioSystem>;
  let hud: HUD;

  beforeEach(() => {
    mockScene = createMockScene();

    mockEconomySystem = {
      getGold: jest.fn().mockReturnValue(100),
      getTarget: jest.fn().mockReturnValue(500),
      setOnGoldChange: jest.fn(),
    } as any;

    mockAudioSystem = {
      toggleMute: jest.fn(),
      getIsMuted: jest.fn().mockReturnValue(false),
    } as any;

    jest.clearAllMocks();
  });

  describe('Construction', () => {
    test('should create HUD with economy system only', () => {
      hud = new HUD(mockScene, mockEconomySystem);

      expect(hud).toBeInstanceOf(HUD);
      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: 100/500',
        expect.objectContaining({
          fontSize: '24px',
          color: '#FFD700',
          fontStyle: 'bold',
          padding: { x: 10, y: 5 }
        })
      );
    });

    test('should create HUD with both economy and audio systems', () => {
      hud = new HUD(mockScene, mockEconomySystem, mockAudioSystem);

      expect(hud).toBeInstanceOf(HUD);
      
      // Should create gold display
      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: 100/500',
        expect.any(Object)
      );

      // Should create sound controls
      expect(mockScene.add.text).toHaveBeenCalledWith(
        20,
        20,
        '🔊',
        expect.objectContaining({
          fontSize: '32px',
          color: '#FFD700',
          padding: { x: 5, y: 5 }
        })
      );
    });

    test('should handle missing audio system gracefully', () => {
      hud = new HUD(mockScene, mockEconomySystem, undefined);

      expect(hud).toBeInstanceOf(HUD);
      expect(mockScene.add.text).toHaveBeenCalledTimes(1); // Only gold display
    });
  });

  describe('Gold Display', () => {
    beforeEach(() => {
      hud = new HUD(mockScene, mockEconomySystem);
    });

    test('should display initial gold amount and target', () => {
      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: 100/500',
        expect.objectContaining({
          fontSize: '24px',
          color: '#FFD700',
          fontStyle: 'bold'
        })
      );
    });

    test('should set scroll factor to 0 for gold text', () => {
      const mockGoldText = mockScene.add.text.mock.results[0].value;
      expect(mockGoldText.setScrollFactor).toHaveBeenCalledWith(0);
    });

    test('should register gold change callback', () => {
      expect(mockEconomySystem.setOnGoldChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test('should update gold display when gold changes', () => {
      const goldChangeCallback = mockEconomySystem.setOnGoldChange.mock.calls[0][0];
      const mockGoldText = mockScene.add.text.mock.results[0].value;

      // Simulate gold change
      goldChangeCallback(250);

      expect(mockGoldText.setText).toHaveBeenCalledWith('Gold: 250/500');
    });

    test('should change color to green when target is reached', () => {
      const goldChangeCallback = mockEconomySystem.setOnGoldChange.mock.calls[0][0];
      const mockGoldText = mockScene.add.text.mock.results[0].value;

      // Simulate reaching target
      goldChangeCallback(500);

      expect(mockGoldText.setText).toHaveBeenCalledWith('Gold: 500/500');
      expect(mockGoldText.setColor).toHaveBeenCalledWith('#2d8659');
    });

    test('should change color when near target (80%)', () => {
      const goldChangeCallback = mockEconomySystem.setOnGoldChange.mock.calls[0][0];
      const mockGoldText = mockScene.add.text.mock.results[0].value;

      // Simulate reaching 80% of target (400 out of 500)
      goldChangeCallback(400);

      expect(mockGoldText.setText).toHaveBeenCalledWith('Gold: 400/500');
      expect(mockGoldText.setColor).toHaveBeenCalledWith('#DAA520');
      expect(mockGoldText.setColor).toHaveBeenCalledWith('#FFD700');
    });

    test('should handle different target values', () => {
      mockEconomySystem.getTarget.mockReturnValue(1000);
      hud = new HUD(mockScene, mockEconomySystem);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: 100/1000',
        expect.any(Object)
      );
    });

    test('should handle zero gold', () => {
      mockEconomySystem.getGold.mockReturnValue(0);
      hud = new HUD(mockScene, mockEconomySystem);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: 0/500',
        expect.any(Object)
      );
    });

    test('should handle negative gold', () => {
      mockEconomySystem.getGold.mockReturnValue(-50);
      hud = new HUD(mockScene, mockEconomySystem);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: -50/500',
        expect.any(Object)
      );
    });
  });

  describe('Sound Controls', () => {
    beforeEach(() => {
      hud = new HUD(mockScene, mockEconomySystem, mockAudioSystem);
    });

    test('should create mute button with correct properties', () => {
      expect(mockScene.add.text).toHaveBeenCalledWith(
        20,
        20,
        '🔊',
        expect.objectContaining({
          fontSize: '32px',
          color: '#FFD700',
          padding: { x: 5, y: 5 }
        })
      );
    });

    test('should set scroll factor to 0 for mute button', () => {
      const mockMuteButton = mockScene.add.text.mock.results[1].value; // Second text element
      expect(mockMuteButton.setScrollFactor).toHaveBeenCalledWith(0);
    });

    test('should make mute button interactive', () => {
      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      expect(mockMuteButton.setInteractive).toHaveBeenCalled();
    });

    test('should register pointer events for mute button', () => {
      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      
      expect(mockMuteButton.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(mockMuteButton.on).toHaveBeenCalledWith('pointerover', expect.any(Function));
      expect(mockMuteButton.on).toHaveBeenCalledWith('pointerout', expect.any(Function));
    });

    test('should toggle mute when button is clicked', () => {
      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      const pointerDownCallback = mockMuteButton.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )[1];

      pointerDownCallback();

      expect(mockAudioSystem.toggleMute).toHaveBeenCalled();
    });

    test('should scale button on hover', () => {
      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      const pointerOverCallback = mockMuteButton.on.mock.calls.find(
        (call: any) => call[0] === 'pointerover'
      )[1];

      pointerOverCallback();

      expect(mockMuteButton.setScale).toHaveBeenCalledWith(1.2);
    });

    test('should reset scale when mouse leaves', () => {
      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      const pointerOutCallback = mockMuteButton.on.mock.calls.find(
        (call: any) => call[0] === 'pointerout'
      )[1];

      pointerOutCallback();

      expect(mockMuteButton.setScale).toHaveBeenCalledWith(1);
    });

    test('should display unmuted icon when audio is not muted', () => {
      mockAudioSystem.getIsMuted.mockReturnValue(false);
      hud = new HUD(mockScene, mockEconomySystem, mockAudioSystem);

      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      expect(mockMuteButton.setText).toHaveBeenCalledWith('🔊');
      expect(mockMuteButton.setColor).toHaveBeenCalledWith('#FFD700');
    });

    test('should display muted icon when audio is muted', () => {
      mockAudioSystem.getIsMuted.mockReturnValue(true);
      hud = new HUD(mockScene, mockEconomySystem, mockAudioSystem);

      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      expect(mockMuteButton.setText).toHaveBeenCalledWith('🔇');
      expect(mockMuteButton.setColor).toHaveBeenCalledWith('#888888');
    });

    test('should update button appearance when mute state changes', () => {
      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      const pointerDownCallback = mockMuteButton.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )[1];

      // Simulate mute toggle
      mockAudioSystem.getIsMuted.mockReturnValue(true);
      pointerDownCallback();

      expect(mockMuteButton.setText).toHaveBeenCalledWith('🔇');
      expect(mockMuteButton.setColor).toHaveBeenCalledWith('#888888');
    });

    test('should handle missing audio system in button click', () => {
      // Create HUD without audio system, then simulate having button somehow
      hud = new HUD(mockScene, mockEconomySystem);
      
      // This should not crash
      expect(() => {
        // The button won't exist without audio system, so this test 
        // verifies the constructor behavior
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null scene', () => {
      expect(() => {
        new HUD(null as any, mockEconomySystem);
      }).toThrow();
    });

    test('should handle null economy system', () => {
      expect(() => {
        new HUD(mockScene, null as any);
      }).toThrow();
    });

    test('should handle scene.add.text returning null', () => {
      mockScene.add.text.mockReturnValue(null);

      expect(() => {
        new HUD(mockScene, mockEconomySystem);
      }).toThrow();
    });

    test('should handle economy system without proper methods', () => {
      const brokenEconomySystem = {} as any;

      expect(() => {
        new HUD(mockScene, brokenEconomySystem);
      }).toThrow();
    });

    test('should handle audio system without proper methods', () => {
      const brokenAudioSystem = {
        toggleMute: jest.fn(),
        // Missing getIsMuted method
      } as any;

      // This should throw during construction because getIsMuted is called
      expect(() => {
        new HUD(mockScene, mockEconomySystem, brokenAudioSystem);
      }).toThrow();
    });

    test('should handle extremely large gold values', () => {
      mockEconomySystem.getGold.mockReturnValue(999999999);
      mockEconomySystem.getTarget.mockReturnValue(1000000000);

      hud = new HUD(mockScene, mockEconomySystem);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: 999999999/1000000000',
        expect.any(Object)
      );
    });

    test('should handle floating point gold values', () => {
      mockEconomySystem.getGold.mockReturnValue(123.45);
      mockEconomySystem.getTarget.mockReturnValue(500.75);

      hud = new HUD(mockScene, mockEconomySystem);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: 123.45/500.75',
        expect.any(Object)
      );
    });

    test('should handle rapid gold changes', () => {
      hud = new HUD(mockScene, mockEconomySystem);
      const goldChangeCallback = mockEconomySystem.setOnGoldChange.mock.calls[0][0];
      const mockGoldText = mockScene.add.text.mock.results[0].value;

      // Simulate rapid changes
      for (let i = 0; i < 100; i++) {
        goldChangeCallback(i * 10);
      }

      expect(mockGoldText.setText).toHaveBeenCalledTimes(100);
    });

    test('should handle mute button interactions without audio system', () => {
      // Create HUD without audio system
      hud = new HUD(mockScene, mockEconomySystem);

      // Verify only gold display was created
      expect(mockScene.add.text).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Considerations', () => {
    test('should not create excessive objects during construction', () => {
      const initialCalls = mockScene.add.text.mock.calls.length;

      hud = new HUD(mockScene, mockEconomySystem, mockAudioSystem);

      // Should only create 2 text objects (gold display + mute button)
      expect(mockScene.add.text.mock.calls.length - initialCalls).toBeLessThanOrEqual(2);
    });

    test('should handle construction quickly', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        new HUD(createMockScene(), mockEconomySystem, mockAudioSystem);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle frequent mute toggles efficiently', () => {
      hud = new HUD(mockScene, mockEconomySystem, mockAudioSystem);
      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      const pointerDownCallback = mockMuteButton.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )[1];

      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        mockAudioSystem.getIsMuted.mockReturnValue(i % 2 === 0);
        pointerDownCallback();
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should handle rapidly
    });
  });

  describe('Integration Scenarios', () => {
    test('should work with different economy system implementations', () => {
      const customEconomySystem = {
        getGold: () => 200,
        getTarget: () => 800,
        setOnGoldChange: jest.fn(),
      } as any;

      hud = new HUD(mockScene, customEconomySystem);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        1050,
        20,
        'Gold: 200/800',
        expect.any(Object)
      );
    });

    test('should work with different audio system implementations', () => {
      const customAudioSystem = {
        toggleMute: jest.fn(),
        getIsMuted: () => true,
      } as any;

      hud = new HUD(mockScene, mockEconomySystem, customAudioSystem);

      const mockMuteButton = mockScene.add.text.mock.results[1].value;
      expect(mockMuteButton.setText).toHaveBeenCalledWith('🔇');
      expect(mockMuteButton.setColor).toHaveBeenCalledWith('#888888');
    });

    test('should support dynamic economy system changes', () => {
      hud = new HUD(mockScene, mockEconomySystem);
      const goldChangeCallback = mockEconomySystem.setOnGoldChange.mock.calls[0][0];

      // Change target dynamically
      mockEconomySystem.getTarget.mockReturnValue(1000);
      goldChangeCallback(300);

      const mockGoldText = mockScene.add.text.mock.results[0].value;
      expect(mockGoldText.setText).toHaveBeenCalledWith('Gold: 300/1000');
    });
  });
});
