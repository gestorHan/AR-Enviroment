// CPP program to detects face in a video

// Include required header files from OpenCV directory
#include <opencv2/objdetect.hpp>
#include <opencv2/highgui.hpp>
#include <opencv2/imgproc.hpp>
#include <opencv2/opencv.hpp>
#include "opencv2/features2d.hpp"
#include "opencv2/xfeatures2d.hpp"

#include <stdio.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>
#define PORT 3001

#include <iostream>

using namespace std;
using namespace cv;

const int MAX_FEATURES = 2000;
const float GOOD_MATCH_PERCENT = 0.20f;

// Function for Face Detection
void detectAndDraw(Mat &img, CascadeClassifier &cascade,
                   CascadeClassifier &nestedCascade, double scale);
string cascadeName, nestedCascadeName;

Mat rvec, tvec;
Mat invertedRT;
Mat rotMat = Mat::zeros(3, 3, CV_32F);

string message = "";
void loadReferenceImage(Mat &imReference, const String name)
{
    string refFilename(name);
    cout << "Reading reference image : " << refFilename << endl;
    imReference = imread(refFilename);
}

void computeDescriptor(Mat &im1, Mat &descriptors1, std::vector<KeyPoint> &keypoints1)
{
    Mat im1Gray;
    cvtColor(im1, im1Gray, cv::COLOR_BGR2GRAY);
    Ptr<Feature2D> orb = ORB::create(MAX_FEATURES);
    orb->detectAndCompute(im1Gray, Mat(), keypoints1, descriptors1);
}

void computeMatches(Mat &descriptors1, Mat &descriptors2, std::vector<DMatch> &matches)
{

    Ptr<DescriptorMatcher> matcher = BFMatcher::create(cv::NORM_HAMMING, true);
    //DescriptorMatcher::create("BruteForce-Hamming");
    matcher->match(descriptors1, descriptors2, matches, Mat());

    // Sort matches by score
    std::sort(matches.begin(), matches.end());
    std::cout << "Matches :" << matches.size() << "\r";

    // Remove not so good matches
    const int numGoodMatches = matches.size() * GOOD_MATCH_PERCENT;
    matches.erase(matches.begin() + numGoodMatches, matches.end());
}

void cameraPoseFromHomography(const Mat &H, Mat &pose)
{
    pose = Mat::eye(3, 4, CV_64FC1); //3x4 matrix
    float norm1 = (float)norm(H.col(0));
    float norm2 = (float)norm(H.col(1));
    float tnorm = (norm1 + norm2) / 2.0f;

    Mat v1 = H.col(0);
    Mat v2 = pose.col(0);

    cv::normalize(v1, v2); // Normalize the rotation

    v1 = H.col(1);
    v2 = pose.col(1);

    cv::normalize(v1, v2);

    v1 = pose.col(0);
    v2 = pose.col(1);

    Mat v3 = v1.cross(v2); //Computes the cross-product of v1 and v2
    Mat c2 = pose.col(2);
    v3.copyTo(c2);

    pose.col(3) = H.col(2) / tnorm; //vector t [R|t]
}

void matching(
    Mat &im1,
    Mat &im2,
    Mat &descriptors1,
    Mat &descriptors2,
    std::vector<KeyPoint> &keypoints1,
    std::vector<KeyPoint> &keypoints2,
    std::vector<DMatch> &matches,
    Mat &imMatches,
    Mat &cameraMatrix,
    Mat &distCoeffs)
{

    computeDescriptor(im2, descriptors2, keypoints2);
    if (!descriptors2.empty())
    {
        computeMatches(descriptors1, descriptors2, matches);
        if (!matches.empty())
        {
            //drawMatches(im1, keypoints1, im2, keypoints2, matches, imMatches);
            //imshow("Features", imMatches);

            std::vector<Point3f> points3d1;
            std::vector<Point2f> points2;
            for (size_t i = 0; i < matches.size(); i++)
            {
                points3d1.push_back(
                    Point3f(
                        keypoints1[matches[i].queryIdx].pt.x,
                        keypoints1[matches[i].queryIdx].pt.y,
                        0.0f));

                points2.push_back(keypoints2[matches[i].trainIdx].pt);
            }

            solvePnP(points3d1, points2, cameraMatrix, distCoeffs, rvec, tvec, false);
            drawFrameAxes(
                im2,
                cameraMatrix, distCoeffs, //intrinsics
                rvec, tvec,
                400.0);

            imshow("Pose from coplanar points", im2);
        }
    }
}

void getInvertedRT(const Mat &roMat)
{
    double t[4][4] = {
        {1.0, 0.0, 0.0, 0.0},
        {0.0, 1.0, 0.0, 0.0},
        {0.0, 0.0, 1.0, 0.0},
        {0.0, 0.0, 0.0, 1.0},
    };

    for (int col = 0; col < 3; col++)
    {
        for (int row = 0; row < 3; row++)
        {
            // Transpose rotation component (inversion)
            t[row][col] = roMat.at<double>(col, row); // roMat.at<double>(col, row);
        }
        // Inverse translation component
        t[3][col] = -tvec.at<double>(col, 0);
    }

    for (int i = 0; i < 4; i++)
    {
        for (int j = 0; j < 4; j++)
            cout << t[i][j] << "  , ";
        cout << endl;
    }
}

int main(int argc, const char **argv)
{
    //sockets
    int sock = 0, valread;
    struct sockaddr_in serv_addr;
    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0)
    {
        printf("\n Socket creation error \n");
        return -1;
    }

    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(PORT);

    // Convert IPv4 and IPv6 addresses from text to binary form
    if (inet_pton(AF_INET, "0.0.0.0", &serv_addr.sin_addr) <= 0)
    {
        printf("\nInvalid address/ Address not supported \n");
        return -1;
    }

    if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0)
    {
        printf("\nConnection Failed \n");
        return -1;
    }
    // sockets

    // VideoCapture class for playing video for which faces to be detected

    const string keys =
        "{ h help |      | print this help message }"
        "{ @image | vtest.avi | path to image file }";
    CommandLineParser parser(argc, argv, keys);

    string filename = samples::findFile(parser.get<string>("@image"));
    if (!parser.check())
    {
        parser.printErrors();
        return 0;
    }

    std::cout << "filename :" << filename << "\n";

    VideoCapture capture;
    Mat frame, image, imMatches;
    Mat homograp, pose;
    Mat descriptors1, descriptors2;
    std::vector<KeyPoint> keypoints1, keypoints2;

    std::vector<DMatch> matches;

    // PreDefined trained XML classifiers with facial features
    CascadeClassifier cascade, nestedCascade;

    loadReferenceImage(image, filename);
    computeDescriptor(image, descriptors1, keypoints1);

    string intrinsicsPath = "./int.yml";
    //! [load-intrinsics]
    FileStorage fs(samples::findFile(intrinsicsPath), FileStorage::READ);
    Mat cameraMatrix, distCoeffs;
    fs["camera_matrix"] >> cameraMatrix;
    fs["distortion_coefficients"] >> distCoeffs;
    //! [load-intrinsics]

    // Start Video..1) 0 for WebCam 2) "Path to Video" for a Local Video
    capture.open(0);

    if (capture.isOpened())
    {

        capture.set(cv::CAP_PROP_FRAME_WIDTH, 800);
        capture.set(cv::CAP_PROP_FRAME_HEIGHT, 600);
        // Capture frames from video and detect faces
        cout << "Face Detection Started...." << endl;

        while (1)
        {
            capture >> frame;
            if (frame.empty())
                break;
            //            Mat frame1;
            Mat frame1 = frame.clone();

            //detectAndDraw( frame1, cascade, nestedCascade, scale );
            matching(image,
                     frame,
                     descriptors1, descriptors2,
                     keypoints1, keypoints2,
                     matches, imMatches,
                     cameraMatrix, distCoeffs);

            //            imshow("Face Detection", image);

            //message = "";
            //cv::Rodrigues(rvec, rotMat);
            //for (int idx = 0; idx < 3; idx++)
            //    message += std::to_string(tvec.at<double>(0, idx)) + ",";
            //for (int idxr = 0; idxr < 3; idxr++)
            //    for (int idxc = 0; idxc < 3; idxc++)
            //        message += std::to_string(rotMat.at<double>(idxr, idxc)) + ",";

            //cout << "M:" << message << endl;

            //send(sock, message.c_str(), message.length(), 0);

            char c = (char)waitKey(10);

            // Press q to exit from window

            if (c == 'p')
            {
                cout << "--------------------- Traslacion  --------------------- \n";
                cout << tvec << endl;

                cout << ":" << tvec.rows << endl;
                cout << ":" << tvec.cols << endl;

                cout << "--------------------- rotacion  --------------------- \n";
                cout << rvec << endl;

                ;
                cv::Rodrigues(rvec, rotMat);

                cout << "--------------------- Mat rotacion  --------------------- \n";
                cout << rotMat << endl;
                cout << endl;

                cout << "--------------------- Mat inverted  --------------------- \n";
                getInvertedRT(rotMat);
                cout << endl;

                message = "";

                for (int idx = 0; idx < 3; idx++)
                    message += std::to_string(tvec.at<double>(0, idx)) + ",";

                for (int idxr = 0; idxr < 3; idxr++)
                    for (int idxc = 0; idxc < 3; idxc++)
                        message += std::to_string(rotMat.at<double>(idxr, idxc)) + ",";

                cout << "M:" << message << endl;

                send(sock, message.c_str(), message.length(), 0);
            }

            if (c == 27 || c == 'q' || c == 'Q')
                break;
        }
    }
    else
        cout << "Could not Open Camera";
    return 0;
}
