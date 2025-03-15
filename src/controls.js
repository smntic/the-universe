let _isControlPressed = false;

export function updateControls(controls, addingObject) {
    if (_isControlPressed || addingObject) {
        controls.enabled = false;
    } else {
        controls.enabled = true;
    }
}

export function handleControlKey() {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Control' || event.key === 'Meta') {
            _isControlPressed = true;
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.key === 'Control' || event.key === 'Meta') {
            _isControlPressed = false;
        }
    });
}

export function isControlPressed() {
    return _isControlPressed;
}
