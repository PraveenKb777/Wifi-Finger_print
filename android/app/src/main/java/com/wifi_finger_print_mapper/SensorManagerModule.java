package com.wifi_finger_print_mapper;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import android.util.Log;

public class SensorManagerModule extends ReactContextBaseJavaModule {
    private static final String REACT_CLASS = "SensorManager";
    private OrientationRecord mOrientationRecord = null;
    private ReactApplicationContext mReactContext;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    public SensorManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
    }

    @ReactMethod
    public int startOrientation(int delay) {
        if (mOrientationRecord == null)
            mOrientationRecord = new OrientationRecord(mReactContext);
        return (mOrientationRecord.start(delay));
    }

    @ReactMethod
    public void stopOrientation() {
        if (mOrientationRecord != null)
            mOrientationRecord.stop();
    }

}