package com.done.app;

import android.view.View;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

    // Keep the HTTP cache across launches so the app can start without network.
    WebView webView = this.getBridge().getWebView();
    webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);

    configureEdgeToEdge();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
        configureEdgeToEdge();
    }
  }

  private void configureEdgeToEdge() {
    // Allows the WebView to draw under the system bars (status bar, nav bar)
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    
    // Set Navigation Bar to transparent (if not already done in styles.xml)
    getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);
    
    // Optional: Hide status bar or leave it depending on requirements.
    // For now, we just ensure edge-to-edge for the bottom nav bar.
  }
}
