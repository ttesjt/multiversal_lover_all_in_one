import React, { useContext, useEffect, useRef } from 'react';
import { SystemOperationsContext } from "../context/SystemRunnerContext";

const AnimatedImage = (default_image) => {
  const { system_operations } = useContext(SystemOperationsContext);
  const imgRef = useRef();

  useEffect(() => {
    try {
      system_operations.system_runner.current_character_runner.animation_controller.upload_default_image(default_image); // Pass the image reference to the animation controller
      system_operations.system_runner.current_character_runner.animation_controller.updata_animation_display_sole(imgRef); // Pass the image reference to the animation controller
    } catch {
      imgRef.current.src = default_image
    }

    return () => {
      system_operations.system_runner.current_character_runner.animation_controller.clean_animation_display(); // Stop the animation when the component is unmounted
    };
  }, [system_operations, system_operations?.system_runner, system_operations?.system_runner?.current_character_runner]);

  return <img ref={imgRef} alt="" className="selected" />;
};

export default AnimatedImage;