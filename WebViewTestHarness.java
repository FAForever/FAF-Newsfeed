///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS org.openjfx:javafx-controls:21.0.2:win
//DEPS org.openjfx:javafx-web:21.0.2:win
//DEPS org.openjfx:javafx-graphics:21.0.2:win
//DEPS org.openjfx:javafx-base:21.0.2:win
//JAVA 17+

import javafx.application.Application;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.web.WebView;
import javafx.stage.Stage;

public class WebViewTestHarness extends Application {

  private static final String HTML_URL = new java.io.File("index.html").toURI().toString();

  @Override
  public void start(Stage stage) {
    StackPane root = new StackPane();
    WebView webView = new WebView();
    
    webView.setPageFill(Color.TRANSPARENT);
    webView.setContextMenuEnabled(true); // Enabled for debugging inspection if needed

    // Redirect JavaScript console messages to the Java terminal output
    webView.getEngine().setOnAlert(event -> System.out.println("[JS ALERT]: " + event.getData()));
    
    // Track Frame/Load Performance markers
    webView.getEngine().getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
        System.out.println("[ENGINE STATUS]: " + newState);
        if (newState == javafx.concurrent.Worker.State.SUCCEEDED) {
            // Inject a script to profile layout execution time
            webView.getEngine().executeScript(
                "console.log = function(msg) { alert(msg); };" +
                "window.performance && setTimeout(() => {" +
                "  var t = window.performance.timing;" +
                "  alert('Page Render Time: ' + (t.loadEventEnd - t.navigationStart) + 'ms');" +
                "}, 1000);"
            );
        }
    });

    root.getChildren().add(webView);
    webView.getEngine().load(HTML_URL);

    Scene scene = new Scene(root, 1280, 900);
    stage.setScene(scene);
    stage.setTitle("WebView Performance Profiler");
    stage.show();
  }

  public static void main(String[] args) {
    // Explicitly disabling hard locks for debugging
    System.setProperty("glass.accessible.force", "false");
    launch(args);
  }
}